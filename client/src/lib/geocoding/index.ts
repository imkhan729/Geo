import type { PlaceResult, GeocoderProvider, GeocoderConfig } from "./types";
import { NominatimProvider } from "./nominatim-provider";
import { PhotonProvider } from "./photon-provider";
import { ProxyProvider } from "./proxy-provider";
import { CompositeProvider } from "./composite-provider";

export * from "./types";
export * from "./cache";
export * from "./rate-limiter";
export * from "./nominatim-provider";
export * from "./photon-provider";
export * from "./proxy-provider";
export * from "./composite-provider";

// Construct default multi-tier resilient provider:
// Tier 1: Proxy provider (uses /api/geocode if backend is running)
// Tier 2: Nominatim provider (direct client-side with cache & rate limiting)
// Tier 3: Photon provider (fast OSM Elasticsearch fallback)
const nominatim = new NominatimProvider();
const photon = new PhotonProvider();
const compositeFallback = new CompositeProvider(nominatim, photon);
let activeProvider: GeocoderProvider = new ProxyProvider(compositeFallback);

/**
 * Returns the currently active geocoder provider instance.
 */
export function getGeocoder(): GeocoderProvider {
  return activeProvider;
}

/**
 * Allows switching the active geocoder provider at runtime (e.g. for testing or custom endpoints).
 */
export function setGeocoderProvider(provider: GeocoderProvider): void {
  activeProvider = provider;
}

/**
 * Convenience singleton instance implementing GeocoderProvider.
 */
export const geocoder: GeocoderProvider = {
  get name() {
    return activeProvider.name;
  },
  search(query: string): Promise<PlaceResult[]> {
    return activeProvider.search(query);
  },
  reverse(lat: number, lng: number): Promise<PlaceResult | null> {
    return activeProvider.reverse(lat, lng);
  },
};
