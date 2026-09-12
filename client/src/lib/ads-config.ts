/**
 * Google AdSense & Monetization Architecture Configuration (Phase 16)
 *
 * Implements safe, layout-guarded monetization readiness without
 * compromising the core geotagging tool or causing Cumulative Layout Shift (CLS).
 *
 * Primary Invariants:
 * - `enabled` is FALSE by default during core rebuild.
 * - Core tool interaction zones (Dropzone, CoordinatePanel, FileQueue, LeafletMap)
 *   are strictly ad-free.
 * - Pre-allocated slot geometries prevent layout shift (CLS = 0.00).
 * - Advertising tags respect Google Consent Mode v2 (ad_storage / ad_personalization).
 */

export interface AdPlacementConfig {
  id: string;
  name: string;
  format: "leaderboard" | "rectangle" | "large-rectangle" | "horizontal" | "responsive";
  minHeightMobile: number;
  minHeightDesktop: number;
  maxWidth?: number;
  adSlotId?: string;
  description: string;
}

export interface AdsSystemConfig {
  /** Master switch. Disabled by default during core rebuild. */
  enabled: boolean;
  /** Publisher ID from client/public/ads.txt and client/index.html */
  client: string;
  /** When enabled, renders clean wireframe debug placeholders in development */
  debugPlaceholders: boolean;
  /** Placements catalog */
  placements: Record<string, AdPlacementConfig>;
}

export const ADS_CONFIG: AdsSystemConfig = {
  enabled: false,
  client: "ca-pub-6438644207209483",
  debugPlaceholders: process.env.NODE_ENV === "development",
  placements: {
    "homepage-below-tool": {
      id: "homepage-below-tool",
      name: "Homepage Below Tool Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Non-intrusive placement situated immediately after the geotagging tool and before the How-To guide.",
    },
    "homepage-mid-content": {
      id: "homepage-mid-content",
      name: "Homepage Mid-Content Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed between the Tool Comparison Table and the In-Depth Technical Guide.",
    },
    "homepage-bottom": {
      id: "homepage-bottom",
      name: "Homepage Bottom Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed before the site FAQ section near the bottom of the page.",
    },
    "gps-finder-below-tool": {
      id: "gps-finder-below-tool",
      name: "GPS Finder Below Tool Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed below the GPS photo inspection results card.",
    },
    "exif-viewer-below-tool": {
      id: "exif-viewer-below-tool",
      name: "EXIF Viewer Below Tool Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed below the EXIF photo inspection results card and above educational content.",
    },
    "remove-gps-below-tool": {
      id: "remove-gps-below-tool",
      name: "Remove GPS Below Tool Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed below the Remove GPS action card and above educational content.",
    },
    "coordinate-converter-below-tool": {
      id: "coordinate-converter-below-tool",
      name: "Coordinate Converter Below Tool Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed below the Coordinate Converter interaction cards and above educational content.",
    },
    "article-mid": {
      id: "article-mid",
      name: "Article Mid-Body Unit",
      format: "rectangle",
      minHeightMobile: 250,
      minHeightDesktop: 250,
      maxWidth: 336,
      description: "Placed between meaningful editorial sections in long-form guides.",
    },
    "article-bottom": {
      id: "article-bottom",
      name: "Article Bottom Banner",
      format: "horizontal",
      minHeightMobile: 100,
      minHeightDesktop: 90,
      maxWidth: 728,
      description: "Placed above related articles at the conclusion of blog posts.",
    },
  },
};

/**
 * Checks if advertising consent has been explicitly granted by the user
 * in compliance with Google Consent Mode v2 and European/California privacy regulations.
 */
export function hasAdConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("fgt-cookie-consent") === "accepted";
  } catch {
    return false;
  }
}
