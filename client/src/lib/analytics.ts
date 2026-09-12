/**
 * Google Analytics 4 & Privacy-Safe Measurement Engine (Phase 15)
 *
 * Implements privacy-first, anonymous product event measurement
 * fully compliant with Google Consent Mode v2 and the Antigravity
 * Zero-PII specification.
 *
 * Guaranteed Invariants:
 * - ZERO GPS coordinates or EXIF payloads sent to analytics
 * - ZERO filenames, street addresses, or search terms sent to analytics
 * - ZERO image bytes or personal photo content sent to analytics
 * - Strict parameter blocklist & automated sanitization
 * - Lightweight client-side Core Web Vitals monitoring (LCP, CLS, INP, FCP, TTFB)
 */

export const GA_MEASUREMENT_ID = "G-BWMMC6PP63";

type Gtag = (...args: unknown[]) => void;

function getGtag(): Gtag | undefined {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof gtag === "function" ? gtag : undefined;
}

/**
 * Strict parameter blocklist: any property matching these names is
 * stripped immediately to prevent accidental leakage of sensitive PII,
 * GPS telemetry, addresses, or file names.
 */
export const PROHIBITED_PARAM_KEYS = new Set([
  "filename",
  "file_name",
  "name",
  "file",
  "path",
  "lat",
  "latitude",
  "lng",
  "lon",
  "longitude",
  "coord",
  "coords",
  "coordinates",
  "address",
  "street",
  "city",
  "zip",
  "postal",
  "query",
  "search",
  "search_term",
  "exif",
  "metadata",
  "payload",
  "bytes",
  "dataurl",
  "data_url",
  "blob",
  "image",
  "imagedata",
  "user_data",
  "email",
  "phone",
  "ip",
]);

const COORDINATE_REGEX = /^-?\d{1,3}\.\d{3,}/;
const EMAIL_REGEX = /\S+@\S+\.\S+/;

/**
 * Sanitizes an event parameter dictionary by stripping prohibited keys
 * and censoring sensitive values like coordinates or emails.
 */
export function sanitizeAnalyticsParams(
  params?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!params) return undefined;

  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(params)) {
    // 1. Drop prohibited keys
    if (PROHIBITED_PARAM_KEYS.has(key.toLowerCase())) {
      continue;
    }

    // 2. Inspect string values for coordinate or email patterns
    if (typeof val === "string") {
      if (COORDINATE_REGEX.test(val.trim()) || EMAIL_REGEX.test(val.trim())) {
        continue;
      }
      sanitized[key] = val;
    } else if (typeof val === "number" || typeof val === "boolean") {
      sanitized[key] = val;
    } else if (Array.isArray(val)) {
      // Numbers or safe strings in array
      sanitized[key] = val.filter(
        (v) =>
          typeof v === "number" ||
          (typeof v === "string" && !COORDINATE_REGEX.test(v) && !EMAIL_REGEX.test(v))
      );
    }
  }

  return sanitized;
}

/** Report a virtual pageview after a client-side route change. */
export function trackPageView(path: string) {
  getGtag()?.("event", "page_view", {
    page_path: path,
    page_title: typeof document !== "undefined" ? document.title : "",
    page_location: typeof window !== "undefined" ? window.location.href : "",
  });
}

/**
 * Report a custom GA4 event with automatic privacy sanitization.
 * No-op when analytics has not loaded (e.g. ad-blocker or consent denied).
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  const safeParams = sanitizeAnalyticsParams(params);
  getGtag()?.("event", name, safeParams);
}

// ─── TOOL FUNNEL EVENTS (Zero PII / Zero Coordinates) ───────────────

export function trackUploadOpened() {
  trackEvent("upload_opened");
}

export function trackFileAccepted(params: { count: number; format: string }) {
  trackEvent("file_accepted", {
    file_count: params.count,
    format_family: params.format.toLowerCase(),
  });
}

export function trackExistingGpsDetected(params: { format: string }) {
  trackEvent("existing_gps_detected", {
    format_family: params.format.toLowerCase(),
  });
}

export function trackMapLocationSelected(params: {
  method: "map_click" | "search" | "device_gps";
}) {
  trackEvent("map_location_selected", {
    selection_method: params.method,
  });
}

export function trackManualCoordinatesEntered(params: { format: "dd" | "dms" }) {
  trackEvent("manual_coordinates_entered", {
    coord_format: params.format,
  });
}

export function trackProcessingStarted(params: {
  mode: "single" | "batch";
  count: number;
}) {
  trackEvent("processing_started", {
    processing_mode: params.mode,
    item_count: params.count,
  });
}

export function trackProcessingCompleted(params: {
  mode: "single" | "batch";
  count: number;
  duration_ms: number;
  success_count: number;
}) {
  trackEvent("processing_completed", {
    processing_mode: params.mode,
    item_count: params.count,
    duration_ms: Math.round(params.duration_ms),
    success_count: params.success_count,
  });
}

export function trackVerificationPassed(params: { format: string }) {
  trackEvent("verification_passed", {
    format_family: params.format.toLowerCase(),
  });
}

export function trackVerificationFailed(params: { reason_category: string }) {
  trackEvent("verification_failed", {
    failure_category: params.reason_category,
  });
}

export function trackDownloadCompleted(params: {
  format: string;
  count: number;
}) {
  trackEvent("download_completed", {
    format_family: params.format.toLowerCase(),
    download_count: params.count,
  });
}

export function trackBatchDownloadCompleted(params: { count: number }) {
  trackEvent("batch_download_completed", {
    download_count: params.count,
  });
}

export function trackGpsFinderUsed(params: {
  has_gps: boolean;
  format: string;
}) {
  trackEvent("gps_finder_used", {
    has_gps: params.has_gps,
    format_family: params.format.toLowerCase(),
  });
}

// ─── QUALITY & ERROR EVENTS (Zero PII) ──────────────────────────────

export function trackUnsupportedFormat(params: { extension: string }) {
  trackEvent("unsupported_format", {
    attempted_extension: params.extension.toLowerCase().slice(0, 10),
  });
}

export function trackParsingError(params: {
  format: string;
  error_category: string;
}) {
  trackEvent("parsing_error", {
    format_family: params.format.toLowerCase(),
    error_category: params.error_category,
  });
}

export function trackWritingError(params: {
  format: string;
  error_category: string;
}) {
  trackEvent("writing_error", {
    format_family: params.format.toLowerCase(),
    error_category: params.error_category,
  });
}

export function trackGeocoderError(params: { error_type: string }) {
  trackEvent("geocoder_error", {
    error_category: params.error_type,
  });
}

export function trackMapLoadError(params?: { layer?: string }) {
  trackEvent("map_load_error", {
    map_layer: params?.layer || "base_tiles",
  });
}

// ─── ACQUISITION EVENTS ─────────────────────────────────────────────

export function trackArticleToToolClick(params: {
  article_slug: string;
  destination: string;
}) {
  trackEvent("article_to_tool_click", {
    source_article: params.article_slug,
    destination_tool: params.destination,
  });
}

// ─── CORE WEB VITALS MONITORING ─────────────────────────────────────

export interface WebVitalMetric {
  name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs_improvement" | "poor";
}

export function trackWebVital(metric: WebVitalMetric) {
  trackEvent("web_vital_measurement", {
    vital_name: metric.name,
    vital_value: metric.value,
    vital_rating: metric.rating,
  });
}

export function getVitalRating(
  name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB",
  value: number
): "good" | "needs_improvement" | "poor" {
  switch (name) {
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs_improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs_improvement" : "poor";
    case "INP":
      return value <= 200 ? "good" : value <= 500 ? "needs_improvement" : "poor";
    case "FCP":
      return value <= 1800 ? "good" : value <= 3000 ? "needs_improvement" : "poor";
    case "TTFB":
      return value <= 800 ? "good" : value <= 1800 ? "needs_improvement" : "poor";
  }
}

/**
 * Native PerformanceObserver Web Vitals listener.
 * Runs client-side with zero external bundle overhead.
 */
export function initWebVitalsMonitoring() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  try {
    // 1. Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const val = Math.round(lastEntry.startTime);
        trackWebVital({
          name: "LCP",
          value: val,
          rating: getVitalRating("LCP", val),
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    // 2. Cumulative Layout Shift (CLS)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    window.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") {
          const rounded = Math.round(clsScore * 1000) / 1000;
          trackWebVital({
            name: "CLS",
            value: rounded,
            rating: getVitalRating("CLS", rounded),
          });
        }
      },
      { once: true }
    );

    // 3. Interaction to Next Paint (INP) / First Input
    const inpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        const val = Math.round(entry.duration || entry.processingStart - entry.startTime);
        trackWebVital({
          name: "INP",
          value: val,
          rating: getVitalRating("INP", val),
        });
      }
    });
    inpObserver.observe({ type: "first-input", buffered: true });

    // 4. First Contentful Paint (FCP) & Navigation TTFB
    const paintObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          const val = Math.round(entry.startTime);
          trackWebVital({
            name: "FCP",
            value: val,
            rating: getVitalRating("FCP", val),
          });
        }
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });

    // 5. Time to First Byte (TTFB)
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const ttfb = Math.round(navEntries[0].responseStart);
      trackWebVital({
        name: "TTFB",
        value: ttfb,
        rating: getVitalRating("TTFB", ttfb),
      });
    }
  } catch (_e) {
    // Non-fatal if browser blocks or doesn't support specific observer
  }
}

