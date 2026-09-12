# FreeGeoTagger — Security & Privacy Architecture Specification

**Version:** 2.0.0  
**Phase:** 14 (Security + Privacy Hardening)  
**Last Updated:** September 2026  
**Status:** Implemented & Verified  

---

## 1. Executive Summary & Privacy Principles

FreeGeoTagger is built upon a **zero-trust, privacy-first architecture**. Because image files frequently contain sensitive personal metadata (including home coordinates, timestamps, device serials, and facial features), FreeGeoTagger enforces complete local processing for all core photo operations.

### Core Architectural Invariants:
1. **Zero Server Image Uploads:** Photos opened in FreeGeoTagger are read, parsed, modified, and saved 100% inside the user's browser runtime using client-side JavaScript, WebAssembly, and HTML5 Canvas. No image bytes or EXIF payloads are ever transmitted to any server.
2. **Zero GPS Coordinate Telemetry:** Coordinates selected on maps, entered manually, or extracted from photos remain in local memory only. They are never transmitted to telemetry, tracking, or analytics backends.
3. **Zero Account Requirements:** The tool does not require registration, passwords, email addresses, or persistent user profiles.
4. **Data Minimization:** Only minimal, anonymous tool usage metrics (e.g., `tool_upload_started`, `download_completed`) are recorded, strictly gated by Google Consent Mode v2.
5. **Defense-in-Depth Security:** Strong HTTP security headers, in-memory IP rate limiting, strict input validation, logging redaction, and dependency minimization protect both the application and upstream providers.

---

## 2. Local-First Processing Mechanism

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|                                                                         |
|  +----------------+     FileReader      +----------------------------+  |
|  | User File      | ------------------> | Memory ArrayBuffer         |  |
|  | (JPG/PNG/WebP) |                     | (Local browser heap only)  |  |
|  +----------------+                     +----------------------------+  |
|                                                       |                 |
|                                          piexifjs / Canvas EXIF         |
|                                                       v                 |
|  +----------------+     Blob Download   +----------------------------+  |
|  | Geotagged File | <------------------ | Updated Binary File        |  |
|  | (Direct save)  |                     | (Locally synthesized)      |  |
|  +----------------+                     +----------------------------+  |
|                                                                         |
|  ======================= NO SERVER UPLOAD ============================  |
+-------------------------------------------------------------------------+
                                    |
                 Only reverse geocode requests pass
                 latitude/longitude (when user searches)
                                    v
+-------------------------------------------------------------------------+
|                        FREEGEOTAGGER SERVER                             |
|  - Rate-limited reverse geocoding proxy (/api/geocode/*)                |
|  - Zero file upload endpoints (no multer, no disk storage)              |
|  - Sanitized request logs (zero coordinate / query payload logging)     |
+-------------------------------------------------------------------------+
```

### Technical Workflow:
1. **File Ingestion:** The user selects a photo via drag-and-drop or file picker. The browser generates a local file handle.
2. **Local Metadata Extraction:** `piexifjs` / `exifreader` parses EXIF, IPTC, and XMP metadata directly in the browser tab.
3. **Interactive Coordinate Selection:** Coordinates are picked via OpenStreetMap/Leaflet tiles or entered manually in DD/DMS format.
4. **Local EXIF Injection:** The client writes GPS tags (`GPSLatitude`, `GPSLongitude`, `GPSAltitude`, `GPSVersionID`) directly into the local binary stream without touching the image pixel payload (preserving 100% original quality).
5. **Local Verification Loop:** The tool immediately re-reads the output binary before offering the download, validating coordinate accuracy to 1e-6 degrees.
6. **Local Download Delivery:** The modified binary is delivered to the user via HTML5 Blob download or `jszip` batch archive.
7. **Memory Cleanup:** Previews and Blob URLs are immediately reclaimed via `URL.revokeObjectURL()` upon removal, reselection, or unmount.

---

## 3. Server Hardening & Attack Surface Minimization

### 3.1 HTTP Security Headers
Both the Express API server (`server/index.ts`) and the Apache static web server (`client/public/.htaccess`) enforce identical, industry-standard security headers:

| Header | Production Setting | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS and prevents SSL stripping attacks. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing vulnerabilities. |
| `X-Frame-Options` | `SAMEORIGIN` | Mitigates clickjacking and cross-frame embedding. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects sensitive URL paths from third-party referrer leakage. |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=()` | Restricts sensor access; disables camera/mic; restricts geolocation to origin. |
| `X-XSS-Protection` | `1; mode=block` | Enables legacy browser reflective XSS filtering. |
| `Content-Security-Policy` | Strict scoped directives (see below) | Restricts authorized script, style, image, connect, and frame origins. |

#### Content Security Policy (CSP) Directives:
```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com https://www.google-analytics.com https://*.doubleclick.net https://pagead2.googlesyndication.com;
connect-src 'self' https://nominatim.openstreetmap.org https://www.google-analytics.com https://analytics.google.com https://*.doubleclick.net https://pagead2.googlesyndication.com;
frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
```

---

### 3.2 In-Memory IP Rate Limiting
To protect upstream geocoding providers (OpenStreetMap Nominatim) and search engine submission endpoints from abuse or denial-of-service, an in-memory sliding-window rate limiter is enforced:

| Endpoint Group | Rate Limit | Behavior on Limit Exceeded |
|---|---|---|
| `/api/geocode/*` | 60 requests / minute / IP | HTTP 429 Too Many Requests + `Retry-After: <sec>` |
| `/api/indexnow` | 10 requests / minute / IP | HTTP 429 Too Many Requests + `Retry-After: <sec>` |
| `/api/*` (General) | 120 requests / minute / IP | HTTP 429 Too Many Requests + `Retry-After: <sec>` |

Headers emitted on all rate-limited responses:
- `X-RateLimit-Limit`: Maximum allowable requests per window.
- `X-RateLimit-Remaining`: Remaining request quota.
- `X-RateLimit-Reset`: Seconds remaining until window reset.

---

### 3.3 Strict Input Validation & Sanitization
All server inputs are validated against strict type, length, and range constraints before processing:

1. **Geocoding Search (`GET /api/geocode/search?q=...`):**
   - Query string must be string type.
   - ASCII control characters (`0x00`–`0x1F`, `0x7F`) are stripped automatically.
   - Maximum length limit: 128 characters (returns HTTP 400 if exceeded).
   - Queries with length < 3 return `[]` immediately without querying upstream.
2. **Reverse Geocoding (`GET /api/geocode/reverse?lat=...&lng=...`):**
   - Parameters must resolve to finite numeric values (`Number.isFinite`).
   - Latitude must be in range [-90.0, 90.0].
   - Longitude must be in range [-180.0, 180.0].
   - Malformed, NaN, Infinite, or out-of-range inputs return HTTP 400 Bad Request.
3. **IndexNow Submissions (`POST /api/indexnow`):**
   - Payload validated against RFC schema.
   - Maximum URL batch size capped at 10,000 URLs per submission.
   - Administrative endpoints protected via `ADMIN_SECRET` bearer verification.
4. **Client-Side File Ingestion:**
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`.
   - SVG uploads are strictly rejected to eliminate stored/DOM-based XSS vectors.
   - Maximum single file size capped at 20MB.

---

### 3.4 Logging Redaction & Zero PII Exposure
The server logging middleware in `server/index.ts` has been audited and hardened:
- **Zero JSON Payload Logging:** Response capturing middleware (`capturedJsonResponse`) has been removed entirely. Coordinates and addresses returned by geocoding are never written to stdout or stderr.
- **Sanitized Request Paths:** Request logs record only `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`. Query parameters (which may contain user-typed addresses or precise GPS coordinates) are excluded from log strings.
- **Error Shielding:** 500-level error handlers log sanitized diagnostics while returning generic error messages to client consumers.

---

### 3.5 Elimination of Unused Dependencies & Vulnerability Management
During Phase 14, all legacy scaffolding dependencies that are irrelevant to a client-side geotagging engine were cleanly uninstalled and pruned from `package.json`:
- **Database libraries removed:** `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `pg`, `connect-pg-simple`.
- **Authentication libraries removed:** `passport`, `passport-local`, `express-session`, `memorystore`.
- **Result:** Elimination of the high-severity SQL injection advisory (GHSA-gpj5-g38j-94v9 in `drizzle-orm`) and a 55-package reduction in the server dependency tree.

---

## 4. Privacy & Trust Copy Alignment

FreeGeoTagger's user-facing copy on `/privacy`, `/about`, `/terms`, and the homepage has been reviewed against actual technical implementation:
- **Transparent local processing:** Accurately states that photos are processed locally in the browser and never uploaded.
- **Zero hyperbole:** Does not falsely claim "100% anonymous across the internet", recognizing that third-party tile servers receive standard IP-based HTTP requests for map tiles.
- **Clear third-party disclosures:** Discloses Google Analytics 4 (gated behind Consent Mode v2) and Google AdSense monetization.
- **Revocable consent:** Users can change or revoke cookie preferences at any time via the cookie banner or footer link.

---

## 5. Security & Privacy QA Checklist

- [x] Security headers present in Express server (`server/index.ts`)
- [x] Security headers present in Apache .htaccess (`client/public/.htaccess`)
- [x] In-memory IP rate limiting active for geocoding and API endpoints
- [x] Query length and character sanitization on `/api/geocode/search`
- [x] Finite numeric and coordinate bounds validation on `/api/geocode/reverse`
- [x] Logging redaction verified (no query strings or response payloads logged)
- [x] Client bundle audited: 0 leaked secrets, 0 API credentials
- [x] Zero server file upload endpoints exist in API routes
- [x] Object URL cleanup verified (`URL.revokeObjectURL`)
- [x] Legacy database and auth packages pruned from `package.json`
- [x] Automated test suite passing (`npm run test:security`)
