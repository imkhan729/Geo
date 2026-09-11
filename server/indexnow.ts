/**
 * IndexNow & Bing Search Discovery Module
 * Implements Section 20 & Phase 11 requirements:
 * - Bing Webmaster Tools & IndexNow key handling
 * - Canonical URL filtering and validation (no blobs, no query params, no non-indexable routes)
 * - Git change mapping to canonical routes
 * - Sanitized logging excluding sensitive credentials or query parameters
 */

export const DEFAULT_INDEXNOW_KEY = "f83e29a0b14c46f6a73d819e6d0a7f14";
export const INDEXNOW_HOST = "freegeotagger.com";
export const BING_SITE_AUTH_CODE = "E0D90E8F27DE42939B95E0528659FECA";

export const CANONICAL_ROUTES = [
  "/",
  "/gps-finder",
  "/blog",
  "/blog/best-free-photo-geotagging-tools",
  "/blog/how-to-add-gps-to-iphone-photos",
  "/blog/how-to-geotag-photos-android",
  "/blog/how-to-geotag-photos-for-google-business-profile",
  "/blog/how-to-geotag-photos-for-real-estate",
  "/blog/what-is-exif-gps-metadata",
  "/blog/how-to-remove-gps-data-from-photos",
  "/blog/how-to-fix-wrong-gps-location-on-photos",
  "/blog/how-to-bulk-geotag-photos",
  "/privacy",
  "/terms",
  "/cookies",
  "/about",
  "/contact",
] as const;

export type CanonicalRoute = (typeof CANONICAL_ROUTES)[number];

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export interface IndexNowSubmissionResult {
  success: boolean;
  status: number;
  submittedCount: number;
  mode: "live" | "dry-run";
  endpoint: string;
  message?: string;
  error?: string;
}

/** Get active IndexNow key from environment or fallback to default */
export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY;
}

/** Get public URL where IndexNow key text file is hosted */
export function getKeyLocation(key = getIndexNowKey(), host = INDEXNOW_HOST): string {
  return `https://${host}/${key}.txt`;
}

/**
 * Validate that a URL strictly belongs to the 17 approved canonical routes
 * Rejects:
 * - Non-HTTPS protocols
 * - Foreign hosts / localhost / IPs
 * - Blob URLs or data URIs
 * - URLs with query parameters or hash fragments
 * - Unapproved or non-canonical paths
 */
export function isValidCanonicalUrl(urlString: string, allowedHost = INDEXNOW_HOST): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  if (urlString.startsWith("blob:") || urlString.startsWith("data:")) return false;

  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== allowedHost) return false;
    if (parsed.port && parsed.port !== "443") return false;
    if (parsed.search !== "" || parsed.hash !== "") return false;

    // Normalize trailing slash: "/" stays "/", others have trailing slash stripped
    let cleanPath = parsed.pathname;
    if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
      cleanPath = cleanPath.slice(0, -1);
    }

    return (CANONICAL_ROUTES as readonly string[]).includes(cleanPath);
  } catch {
    return false;
  }
}

/** Filter and deduplicate a list of URLs to only valid canonical URLs */
export function filterCanonicalUrls(urls: string[], allowedHost = INDEXNOW_HOST): string[] {
  const validSet = new Set<string>();
  for (const url of urls) {
    if (isValidCanonicalUrl(url, allowedHost)) {
      // Normalize pathname
      try {
        const parsed = new URL(url);
        let cleanPath = parsed.pathname;
        if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
          cleanPath = cleanPath.slice(0, -1);
        }
        validSet.add(`https://${allowedHost}${cleanPath}`);
      } catch {
        // ignore
      }
    }
  }
  return Array.from(validSet);
}

/** Mask key for sanitized logging */
export function maskKey(key: string): string {
  if (!key || key.length < 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Sanitize log strings to exclude sensitive credentials, API keys, or auth headers
 */
export function sanitizeLog(text: string, activeKey = getIndexNowKey()): string {
  let sanitized = text;
  if (activeKey && activeKey.length >= 8) {
    sanitized = sanitized.replaceAll(activeKey, maskKey(activeKey));
  }
  // Mask generic Bearer tokens or secret headers
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, "Bearer [REDACTED]");
  sanitized = sanitized.replace(/x-admin-key:\s*[^\s]+/gi, "x-admin-key: [REDACTED]");
  return sanitized;
}

/**
 * Map modified file paths (e.g. from git diff or build) to target canonical URLs
 */
export function mapChangedFilesToUrls(filePaths: string[], host = INDEXNOW_HOST): string[] {
  const urlSet = new Set<string>();

  const fileMap: Record<string, string> = {
    "client/src/pages/home.tsx": "/",
    "client/src/pages/gps-finder.tsx": "/gps-finder",
    "client/src/pages/about.tsx": "/about",
    "client/src/pages/contact.tsx": "/contact",
    "client/src/pages/privacy.tsx": "/privacy",
    "client/src/pages/terms.tsx": "/terms",
    "client/src/pages/cookies.tsx": "/cookies",
    "client/src/pages/blog/best-free-photo-geotagging-tools.tsx": "/blog/best-free-photo-geotagging-tools",
    "client/src/pages/blog/how-to-add-gps-to-iphone-photos.tsx": "/blog/how-to-add-gps-to-iphone-photos",
    "client/src/pages/blog/how-to-geotag-photos-android.tsx": "/blog/how-to-geotag-photos-android",
    "client/src/pages/blog/how-to-geotag-photos-for-google-business-profile.tsx": "/blog/how-to-geotag-photos-for-google-business-profile",
    "client/src/pages/blog/how-to-geotag-photos-for-real-estate.tsx": "/blog/how-to-geotag-photos-for-real-estate",
    "client/src/pages/blog/what-is-exif-gps-metadata.tsx": "/blog/what-is-exif-gps-metadata",
    "client/src/pages/blog/how-to-remove-gps-data-from-photos.tsx": "/blog/how-to-remove-gps-data-from-photos",
    "client/src/pages/blog/how-to-fix-wrong-gps-location-on-photos.tsx": "/blog/how-to-fix-wrong-gps-location-on-photos",
    "client/src/pages/blog/how-to-bulk-geotag-photos.tsx": "/blog/how-to-bulk-geotag-photos",
  };

  for (const rawFile of filePaths) {
    const normalized = rawFile.replace(/\\/g, "/");
    for (const [sourceFile, canonicalPath] of Object.entries(fileMap)) {
      if (normalized.endsWith(sourceFile) || normalized === sourceFile) {
        urlSet.add(`https://${host}${canonicalPath}`);
      }
    }
  }

  return Array.from(urlSet);
}

/** Construct a validated IndexNow payload */
export function createIndexNowPayload(
  urls: string[],
  options: { host?: string; key?: string; keyLocation?: string } = {}
): { valid: boolean; payload?: IndexNowPayload; error?: string; invalidUrls?: string[] } {
  const host = options.host || INDEXNOW_HOST;
  const key = options.key || getIndexNowKey();
  const keyLocation = options.keyLocation || getKeyLocation(key, host);

  if (!Array.isArray(urls) || urls.length === 0) {
    return { valid: false, error: "URL list must be a non-empty array" };
  }

  const invalidUrls = urls.filter((u) => !isValidCanonicalUrl(u, host));
  if (invalidUrls.length > 0) {
    return {
      valid: false,
      error: "Contains non-canonical or invalid URLs",
      invalidUrls: invalidUrls.slice(0, 5),
    };
  }

  const validUrls = filterCanonicalUrls(urls, host);
  return {
    valid: true,
    payload: {
      host,
      key,
      keyLocation,
      urlList: validUrls,
    },
  };
}

/**
 * Submit URLs to IndexNow endpoint
 */
export async function submitToIndexNow(
  payload: IndexNowPayload,
  options: {
    dryRun?: boolean;
    endpoint?: string;
    logger?: (msg: string) => void;
  } = {}
): Promise<IndexNowSubmissionResult> {
  const log = options.logger || console.log;
  const isDryRun = options.dryRun ?? (process.env.INDEXNOW_SUBMIT !== "true");
  const endpoint = options.endpoint || "https://api.indexnow.org/indexnow";

  const urlPaths = payload.urlList.map((u) => {
    try {
      return new URL(u).pathname;
    } catch {
      return u;
    }
  });

  if (isDryRun) {
    log(
      sanitizeLog(
        `[IndexNow Dry-Run] Host: ${payload.host} | Key: ${maskKey(payload.key)} | URLs (${payload.urlList.length}): ${JSON.stringify(urlPaths)}`
      )
    );
    return {
      success: true,
      status: 200,
      submittedCount: payload.urlList.length,
      mode: "dry-run",
      endpoint,
      message: `Validated ${payload.urlList.length} canonical URLs in dry-run mode (no network call)`,
    };
  }

  log(
    sanitizeLog(
      `[IndexNow Submitting] Target: ${endpoint} | Host: ${payload.host} | Key: ${maskKey(payload.key)} | URLs (${payload.urlList.length}): ${JSON.stringify(urlPaths)}`
    )
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "FreeGeoTagger-IndexNow/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    log(
      sanitizeLog(
        `[IndexNow Response] Status: ${response.status} ${response.statusText} for ${payload.urlList.length} URLs`
      )
    );

    return {
      success: response.ok || response.status === 200 || response.status === 202,
      status: response.status,
      submittedCount: payload.urlList.length,
      mode: "live",
      endpoint,
      message: response.ok ? "IndexNow accepted submission" : `HTTP ${response.status}`,
    };
  } catch (err: any) {
    const errorMsg = err.name === "AbortError" ? "Request timed out (10s)" : err.message;
    log(sanitizeLog(`[IndexNow Error] Failed to submit: ${errorMsg}`));
    return {
      success: false,
      status: 502,
      submittedCount: 0,
      mode: "live",
      endpoint,
      error: errorMsg,
    };
  }
}
