import type { PlaceResult } from "./types";

/**
 * Normalizes query string for cache key generation
 */
export function normalizeQueryKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Normalizes latitude and longitude coordinates for reverse lookup cache key.
 * Rounds to 4 decimal places (~11 meters at equator), preventing redundant network calls
 * when clicking nearby or panning slightly.
 */
export function normalizeCoordKey(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `rev:${roundedLat.toFixed(4)},${roundedLng.toFixed(4)}`;
}

/**
 * Least-Recently-Used (LRU) Cache with fixed capacity.
 * Uses ES6 Map which maintains insertion order; accessed items are moved to the end.
 */
export class GeocodingCache {
  private readonly capacity: number;
  private readonly map: Map<string, any>;

  constructor(capacity = 100) {
    this.capacity = Math.max(1, capacity);
    this.map = new Map();
  }

  get<T>(key: string): T | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    // Refresh position to mark as recently used
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set<T>(key: string, value: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict oldest (first) item
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  // --- Specialized Helpers ---

  getQuery(query: string): PlaceResult[] | undefined {
    const key = `q:${normalizeQueryKey(query)}`;
    return this.get<PlaceResult[]>(key);
  }

  setQuery(query: string, results: PlaceResult[]): void {
    const key = `q:${normalizeQueryKey(query)}`;
    this.set(key, results);
  }

  getReverse(lat: number, lng: number): PlaceResult | null | undefined {
    const key = normalizeCoordKey(lat, lng);
    return this.get<PlaceResult | null>(key);
  }

  setReverse(lat: number, lng: number, result: PlaceResult | null): void {
    const key = normalizeCoordKey(lat, lng);
    this.set(key, result);
  }
}
