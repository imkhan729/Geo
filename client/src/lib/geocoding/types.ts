/**
 * Geocoding & Map Provider Abstraction Types
 * FreeGeoTagger Phase 7 Architecture
 */

export interface PlaceResult {
  lat: number;
  lng: number;
  displayName: string;
  address?: Record<string, string>;
  boundingbox?: [string, string, string, string];
  osmType?: string;
  osmId?: number;
  importance?: number;
}

export interface GeocoderProvider {
  readonly name: string;
  search(query: string): Promise<PlaceResult[]>;
  reverse(lat: number, lng: number): Promise<PlaceResult | null>;
}

export interface MapPickerAdapter {
  init(container: HTMLElement, options: { lat: number; lng: number; zoom: number; readOnly?: boolean }): void;
  setCoordinates(lat: number, lng: number): void;
  onCoordinatesChange(callback: (lat: number, lng: number) => void): void;
  destroy(): void;
}

export interface GeocoderConfig {
  minQueryLength?: number;
  cacheCapacity?: number;
  rateLimitMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}
