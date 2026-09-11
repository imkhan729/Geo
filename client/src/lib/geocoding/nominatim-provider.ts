import type { PlaceResult, GeocoderProvider, GeocoderConfig } from "./types";
import { GeocodingCache } from "./cache";
import { RateLimiter } from "./rate-limiter";

export class NominatimProvider implements GeocoderProvider {
  readonly name = "nominatim";
  private readonly baseUrl: string;
  private readonly minQueryLength: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly cache: GeocodingCache;
  private readonly rateLimiter: RateLimiter;

  constructor(config: GeocoderConfig = {}, baseUrl = "https://nominatim.openstreetmap.org") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.minQueryLength = config.minQueryLength ?? 3;
    this.timeoutMs = config.timeoutMs ?? 6000;
    this.userAgent = config.userAgent ?? "FreeGeoTagger/2.0 (privacy-friendly open-source geotagger; contact@freegeotagger.com)";
    this.cache = new GeocodingCache(config.cacheCapacity ?? 100);
    this.rateLimiter = new RateLimiter(config.rateLimitMs ?? 1000);
  }

  async search(query: string): Promise<PlaceResult[]> {
    if (!query) return [];
    const trimmed = query.trim();
    if (trimmed.length < this.minQueryLength) {
      return [];
    }

    // 1. Check in-memory cache
    const cached = this.cache.getQuery(trimmed);
    if (cached) {
      return cached;
    }

    // 2. Schedule via rate limiter to obey OSM 1 req/sec policy
    try {
      const results = await this.rateLimiter.schedule(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": this.userAgent,
            },
            signal: controller.signal,
          });

          if (!response.ok) {
            console.warn(`[NominatimProvider] HTTP ${response.status} for search: "${trimmed}"`);
            return [];
          }

          const data = await response.json();
          if (!Array.isArray(data)) return [];

          const parsed: PlaceResult[] = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name,
            address: item.address || undefined,
            boundingbox: item.boundingbox,
            osmType: item.osm_type,
            osmId: item.osm_id ? Number(item.osm_id) : undefined,
            importance: item.importance ? Number(item.importance) : undefined,
          }));

          return parsed;
        } finally {
          clearTimeout(timeoutId);
        }
      });

      // 3. Cache successful results
      if (results && results.length > 0) {
        this.cache.setQuery(trimmed, results);
      }

      return results;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn(`[NominatimProvider] Search timed out after ${this.timeoutMs}ms: "${trimmed}"`);
      } else {
        console.warn(`[NominatimProvider] Search error:`, err.message || err);
      }
      return [];
    }
  }

  async reverse(lat: number, lng: number): Promise<PlaceResult | null> {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      return null;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    // 1. Check in-memory cache
    const cached = this.cache.getReverse(lat, lng);
    if (cached !== undefined) {
      return cached;
    }

    // 2. Schedule via rate limiter
    try {
      const result = await this.rateLimiter.schedule(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": this.userAgent,
            },
            signal: controller.signal,
          });

          if (!response.ok) {
            console.warn(`[NominatimProvider] HTTP ${response.status} for reverse: (${lat}, ${lng})`);
            return null;
          }

          const data = await response.json();
          if (!data || data.error || !data.lat || !data.lon) {
            return null;
          }

          const parsed: PlaceResult = {
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon),
            displayName: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            address: data.address || undefined,
            boundingbox: data.boundingbox,
            osmType: data.osm_type,
            osmId: data.osm_id ? Number(data.osm_id) : undefined,
            importance: data.importance ? Number(data.importance) : undefined,
          };

          return parsed;
        } finally {
          clearTimeout(timeoutId);
        }
      });

      // 3. Cache result (including null for unresolvable coords to prevent hammering)
      this.cache.setReverse(lat, lng, result);
      return result;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn(`[NominatimProvider] Reverse geocode timed out: (${lat}, ${lng})`);
      } else {
        console.warn(`[NominatimProvider] Reverse geocode error:`, err.message || err);
      }
      return null;
    }
  }

  // Clear internal cache (useful for testing or memory pressure)
  clearCache(): void {
    this.cache.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}
