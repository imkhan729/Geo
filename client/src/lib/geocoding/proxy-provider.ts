import type { PlaceResult, GeocoderProvider } from "./types";
import { GeocodingCache } from "./cache";

/**
 * Backend Proxy Geocoder Provider.
 * Calls /api/geocode endpoints when running with a backend server,
 * and seamlessly delegates to an underlying direct provider if the backend is absent (e.g. static Hostinger Apache).
 */
export class ProxyProvider implements GeocoderProvider {
  readonly name = "proxy";
  private readonly fallbackProvider: GeocoderProvider;
  private backendAvailable: boolean | null = null;
  private readonly cache: GeocodingCache;

  constructor(fallbackProvider: GeocoderProvider) {
    this.fallbackProvider = fallbackProvider;
    this.cache = new GeocodingCache(100);
  }

  async search(query: string): Promise<PlaceResult[]> {
    if (!query || query.trim().length < 3) return [];
    const trimmed = query.trim();

    const cached = this.cache.getQuery(trimmed);
    if (cached) return cached;

    // If we already know the backend is not available, use fallback immediately
    if (this.backendAvailable === false) {
      return this.fallbackProvider.search(trimmed);
    }

    try {
      const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(trimmed)}`, {
        headers: { Accept: "application/json" },
      });

      if (response.status === 404 || response.status === 502 || response.status === 503) {
        // Static host or backend down: switch to fallback
        this.backendAvailable = false;
        return this.fallbackProvider.search(trimmed);
      }

      if (!response.ok) {
        return this.fallbackProvider.search(trimmed);
      }

      this.backendAvailable = true;
      const data = await response.json();
      if (Array.isArray(data)) {
        this.cache.setQuery(trimmed, data);
        return data;
      }
      return [];
    } catch {
      // Network error or fetch failure -> use fallback
      this.backendAvailable = false;
      return this.fallbackProvider.search(trimmed);
    }
  }

  async reverse(lat: number, lng: number): Promise<PlaceResult | null> {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return null;

    const cached = this.cache.getReverse(lat, lng);
    if (cached !== undefined) return cached;

    if (this.backendAvailable === false) {
      return this.fallbackProvider.reverse(lat, lng);
    }

    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
        headers: { Accept: "application/json" },
      });

      if (response.status === 404 || response.status === 502 || response.status === 503) {
        this.backendAvailable = false;
        return this.fallbackProvider.reverse(lat, lng);
      }

      if (!response.ok) {
        return this.fallbackProvider.reverse(lat, lng);
      }

      this.backendAvailable = true;
      const data = await response.json();
      this.cache.setReverse(lat, lng, data);
      return data;
    } catch {
      this.backendAvailable = false;
      return this.fallbackProvider.reverse(lat, lng);
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.backendAvailable = null;
  }
}
