import type { PlaceResult, GeocoderProvider, GeocoderConfig } from "./types";
import { GeocodingCache } from "./cache";

/**
 * Photon Geocoder Provider (Komoot OSM Elasticsearch service).
 * Provides high-speed search and reverse geocoding as a secondary fallback.
 */
export class PhotonProvider implements GeocoderProvider {
  readonly name = "photon";
  private readonly baseUrl: string;
  private readonly minQueryLength: number;
  private readonly timeoutMs: number;
  private readonly cache: GeocodingCache;

  constructor(config: GeocoderConfig = {}, baseUrl = "https://photon.komoot.io") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.minQueryLength = config.minQueryLength ?? 3;
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.cache = new GeocodingCache(config.cacheCapacity ?? 100);
  }

  async search(query: string): Promise<PlaceResult[]> {
    if (!query) return [];
    const trimmed = query.trim();
    if (trimmed.length < this.minQueryLength) return [];

    const cached = this.cache.getQuery(trimmed);
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}/api/?q=${encodeURIComponent(trimmed)}&limit=5`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        return [];
      }

      const geojson = await response.json();
      if (!geojson || !Array.isArray(geojson.features)) return [];

      const results: PlaceResult[] = geojson.features.map((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        const p = feature.properties || {};
        const parts = [p.name, p.street, p.city || p.town || p.village, p.state, p.country].filter(Boolean);
        const displayName = parts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        return {
          lat: Number(lat),
          lng: Number(lng),
          displayName,
          address: {
            name: p.name,
            street: p.street,
            city: p.city || p.town || p.village,
            state: p.state,
            country: p.country,
            postcode: p.postcode,
          },
          osmType: p.osm_type,
          osmId: p.osm_id ? Number(p.osm_id) : undefined,
        };
      });

      if (results.length > 0) {
        this.cache.setQuery(trimmed, results);
      }

      return results;
    } catch {
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async reverse(lat: number, lng: number): Promise<PlaceResult | null> {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    const cached = this.cache.getReverse(lat, lng);
    if (cached !== undefined) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}/reverse?lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) return null;

      const geojson = await response.json();
      if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
        return null;
      }

      const feature = geojson.features[0];
      const [featLng, featLat] = feature.geometry.coordinates;
      const p = feature.properties || {};
      const parts = [p.name, p.street, p.city || p.town || p.village, p.state, p.country].filter(Boolean);
      const displayName = parts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      const result: PlaceResult = {
        lat: Number(featLat ?? lat),
        lng: Number(featLng ?? lng),
        displayName,
        address: {
          name: p.name,
          street: p.street,
          city: p.city || p.town || p.village,
          state: p.state,
          country: p.country,
        },
      };

      this.cache.setReverse(lat, lng, result);
      return result;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
