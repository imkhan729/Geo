import type { PlaceResult, GeocoderProvider } from "./types";

/**
 * Composite Geocoder Provider that tries a primary provider first,
 * and automatically falls back to a secondary provider if the primary
 * yields no results or encounters an error/rate-limit.
 */
export class CompositeProvider implements GeocoderProvider {
  readonly name: string;
  private readonly primary: GeocoderProvider;
  private readonly secondary: GeocoderProvider;

  constructor(primary: GeocoderProvider, secondary: GeocoderProvider) {
    this.primary = primary;
    this.secondary = secondary;
    this.name = `${primary.name}+${secondary.name}`;
  }

  async search(query: string): Promise<PlaceResult[]> {
    try {
      const results = await this.primary.search(query);
      if (results && results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn(`[CompositeProvider] Primary provider ${this.primary.name} failed search:`, err);
    }

    try {
      return await this.secondary.search(query);
    } catch (err) {
      console.warn(`[CompositeProvider] Secondary provider ${this.secondary.name} failed search:`, err);
      return [];
    }
  }

  async reverse(lat: number, lng: number): Promise<PlaceResult | null> {
    try {
      const result = await this.primary.reverse(lat, lng);
      if (result) {
        return result;
      }
    } catch (err) {
      console.warn(`[CompositeProvider] Primary provider ${this.primary.name} failed reverse:`, err);
    }

    try {
      return await this.secondary.reverse(lat, lng);
    } catch (err) {
      console.warn(`[CompositeProvider] Secondary provider ${this.secondary.name} failed reverse:`, err);
      return null;
    }
  }
}
