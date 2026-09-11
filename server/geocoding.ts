/**
 * Server-Side Geocoding Service
 * FreeGeoTagger Phase 7 Provider Layer
 */

export interface ServerPlaceResult {
  lat: number;
  lng: number;
  displayName: string;
  address?: Record<string, string>;
  boundingbox?: [string, string, string, string];
  osmType?: string;
  osmId?: number;
  importance?: number;
}

class ServerGeocodingService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxCacheSize = 200;
  private cacheTtlMs = 1000 * 60 * 60; // 1 hour TTL
  private lastRequestTime = 0;
  private minIntervalMs = 1000; // Strictly respect OSM 1 req/sec policy
  private userAgent = "FreeGeoTagger/2.0 (Server-Side Proxy; contact@freegeotagger.com)";

  private async waitForSlot(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private cleanOldCache(): void {
    if (this.cache.size > this.maxCacheSize) {
      const now = Date.now();
      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > this.cacheTtlMs) {
          this.cache.delete(key);
        }
      });
      if (this.cache.size > this.maxCacheSize) {
        // Evict oldest entries
        const keysToDelete: string[] = [];
        this.cache.forEach((_val, key) => {
          if (keysToDelete.length < 50) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach((k) => this.cache.delete(k));
      }
    }
  }

  async search(query: string): Promise<ServerPlaceResult[]> {
    if (!query || typeof query !== "string") return [];
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 3) return [];

    const cacheKey = `search:${trimmed}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    await this.waitForSlot();

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        console.warn(`[ServerGeocoding] Nominatim search returned HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      const results: ServerPlaceResult[] = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        address: item.address || undefined,
        boundingbox: item.boundingbox,
        osmType: item.osm_type,
        osmId: item.osm_id ? Number(item.osm_id) : undefined,
        importance: item.importance ? Number(item.importance) : undefined,
      }));

      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
      this.cleanOldCache();
      return results;
    } catch (err: any) {
      console.error("[ServerGeocoding] Search request failed:", err.message || err);
      return [];
    }
  }

  async reverse(lat: number, lng: number): Promise<ServerPlaceResult | null> {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    const cacheKey = `reverse:${roundedLat.toFixed(4)},${roundedLng.toFixed(4)}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    await this.waitForSlot();

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        console.warn(`[ServerGeocoding] Nominatim reverse returned HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (!data || data.error || !data.lat || !data.lon) return null;

      const result: ServerPlaceResult = {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        displayName: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        address: data.address || undefined,
        boundingbox: data.boundingbox,
        osmType: data.osm_type,
        osmId: data.osm_id ? Number(data.osm_id) : undefined,
        importance: data.importance ? Number(data.importance) : undefined,
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      this.cleanOldCache();
      return result;
    } catch (err: any) {
      console.error("[ServerGeocoding] Reverse request failed:", err.message || err);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const serverGeocoding = new ServerGeocodingService();
