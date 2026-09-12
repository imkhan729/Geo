import React, { useEffect, useRef } from "react";
import { ADS_CONFIG, hasAdConsent } from "@/lib/ads-config";

export interface AdSlotProps {
  /** Unique placement identifier matching ADS_CONFIG.placements */
  placement: string;
  /** Format of the ad unit */
  format?: "leaderboard" | "rectangle" | "large-rectangle" | "horizontal" | "responsive";
  /** Specific Google AdSense Slot ID if assigned */
  slotId?: string;
  /** Additional styling classes for the wrapper */
  className?: string;
  /** Reserve layout height to guarantee CLS = 0.00 (default: true) */
  reserveSpace?: boolean;
  /** Show subtle "Advertisement" label above unit when active */
  showLabel?: boolean;
}

/**
 * Forbidden interaction zones where ads must NEVER be placed
 * per Section 25 of the FreeGeoTagger specification.
 */
const FORBIDDEN_PLACEMENTS = new Set([
  "dropzone",
  "file-queue",
  "coordinate-panel",
  "map",
  "leaflet-map",
  "preview",
  "modal",
  "error-message",
]);

/**
 * Reusable, CLS-guarded AdSlot component.
 *
 * Guaranteed Invariants:
 * - Stays 100% disabled by default (`ADS_CONFIG.enabled === false`)
 * - Pre-allocates fixed min-height to ensure Cumulative Layout Shift remains 0.00
 * - Refuses to render in forbidden core tool zones
 * - Checks Google Consent Mode v2 user choice before requesting ads
 */
export function AdSlot({
  placement,
  format = "horizontal",
  slotId,
  className = "",
  reserveSpace = true,
  showLabel = false,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoadedRef = useRef(false);

  // Safety check: Prevent ads in forbidden core tool zones
  const isForbidden = FORBIDDEN_PLACEMENTS.has(placement.toLowerCase());
  if (isForbidden) {
    console.error(`[AdSlot Security] Refusing to render ad in forbidden core tool zone: "${placement}"`);
    return null;
  }

  const placementConfig = ADS_CONFIG.placements[placement];
  const activeFormat = placementConfig?.format || format;
  const minHeightDesktop = placementConfig?.minHeightDesktop || (activeFormat === "rectangle" ? 250 : activeFormat === "large-rectangle" ? 280 : 90);
  const minHeightMobile = placementConfig?.minHeightMobile || (activeFormat === "rectangle" ? 250 : activeFormat === "large-rectangle" ? 280 : 100);
  const maxWidth = placementConfig?.maxWidth || (activeFormat === "rectangle" ? 336 : 728);

  const isEnabled = ADS_CONFIG.enabled;
  const showDebugPlaceholder = !isEnabled && ADS_CONFIG.debugPlaceholders;

  useEffect(() => {
    if (!isEnabled || isLoadedRef.current) return;
    if (!hasAdConsent()) return;

    try {
      if (typeof window !== "undefined") {
        const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || [];
        adsbygoogle.push({});
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = adsbygoogle;
        isLoadedRef.current = true;
      }
    } catch (err) {
      console.error(`[AdSlot] Failed to initialize AdSense slot ${placement}:`, err);
    }
  }, [isEnabled, placement]);

  // When monetization is inactive:
  if (!isEnabled) {
    if (!showDebugPlaceholder) {
      return null;
    }

    // In development mode, display a lightweight, non-shifting wireframe
    return (
      <div
        className={`my-6 flex flex-col items-center justify-center ${className}`}
        data-testid={`ad-slot-debug-${placement}`}
        aria-hidden="true"
      >
        <div
          style={{
            minHeight: `${minHeightDesktop}px`,
            maxWidth: `${maxWidth}px`,
          }}
          className="w-full rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center flex flex-col items-center justify-center text-xs text-muted-foreground transition-colors"
        >
          <span className="font-mono font-medium text-[11px] tracking-wider uppercase opacity-70">
            Ad Placement Area (Phase 16 Inactive)
          </span>
          <span className="text-[10px] text-muted-foreground/60 mt-1">
            {placement} • {activeFormat} • {maxWidth}x{minHeightDesktop}
          </span>
        </div>
      </div>
    );
  }

  // When monetization is active:
  return (
    <aside
      className={`ad-slot-container my-6 flex flex-col items-center justify-center ${className}`}
      data-testid={`ad-slot-${placement}`}
      aria-label="Advertisement"
    >
      {showLabel && (
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1.5 self-center">
          Advertisement
        </span>
      )}
      <div
        style={
          reserveSpace
            ? {
                minHeight: `${minHeightDesktop}px`,
                maxWidth: `${maxWidth}px`,
              }
            : undefined
        }
        className="w-full flex items-center justify-center overflow-hidden"
      >
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADS_CONFIG.client}
          data-ad-slot={slotId || placementConfig?.adSlotId}
          data-ad-format={activeFormat === "horizontal" ? "horizontal" : activeFormat === "rectangle" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
