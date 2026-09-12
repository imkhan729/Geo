# FreeGeoTagger Analytics & Conversion Measurement Specification (Phase 15)

## 1. Overview & Privacy Principles
FreeGeoTagger is a privacy-first, client-side photo geotagging web application. Location metadata, photo coordinates, and user image files are sensitive personal information. Under the **Zero-PII Analytics Guardrail**, analytics is designed strictly to measure aggregate product engagement, tool conversion funnels, browser performance, and error frequencies without transmitting any personal identifiable information (PII) or image telemetry.

### Core Guaranteed Invariants
1. **Zero GPS Coordinates:** Exact coordinates (latitude, longitude, altitude), coordinate strings, and DMS values are never sent to analytics under any circumstances.
2. **Zero Image / File Telemetry:** Filenames, directory paths, EXIF raw payloads, image bytes, and base64/data URLs are strictly blocked.
3. **Zero Location / Address Data:** Search queries, street addresses, city names, postal codes, and reverse-geocoded place names are never sent to analytics.
4. **Automated Runtime Sanitization:** Every event parameter object is filtered through `sanitizeAnalyticsParams()`, which drops blocklisted keys and censors coordinate or email patterns in string values.
5. **Strict Google Consent Mode v2:** Default-denied state (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` all set to `denied`) loaded prior to any analytics scripts. Only updated to `granted` upon explicit user acceptance via the cookie banner.

---

## 2. Parameter Blocklist & Value Sanitizer

### Prohibited Parameter Keys
Any parameter key matching any of the following (case-insensitive) is completely dropped before reaching `window.gtag`:
- `filename`, `file_name`, `fileName`, `name`, `file`, `path`
- `lat`, `latitude`, `lng`, `lon`, `longitude`, `coord`, `coords`, `coordinates`
- `address`, `street`, `city`, `zip`, `postal`
- `query`, `search`, `search_term`
- `exif`, `metadata`, `payload`, `bytes`
- `dataUrl`, `data_url`, `blob`, `image`, `imageData`, `user_data`
- `email`, `phone`, `ip`

### Value Pattern Scrubbing
Even for un-blocklisted keys, string values are tested against:
- **Coordinate Regex:** `/^-?\d{1,3}\.\d{3,}/` (detects floating-point geographic coordinate strings).
- **Email Regex:** `/\S+@\S+\.\S+/` (detects accidental email strings).

If a pattern matches, the value is suppressed.

---

## 3. GA4 Event Taxonomy

### A. Acquisition Events
| Event Name | Trigger | Parameters | Description |
|---|---|---|---|
| `page_view` | Client-side SPA navigation | `page_path`, `page_title`, `page_location` | Tracks virtual page views after route rendering |
| `article_to_tool_click` | User clicks CTA button in a blog article | `source_article`, `destination_tool` | Tracks conversion from informational articles to the geotagging tool or GPS finder |

### B. Tool Funnel Events (Zero Coordinates / Zero Filenames)
| Event Name | Trigger | Parameters | Description |
|---|---|---|---|
| `upload_opened` | Dropzone clicked or file picker triggered | (None) | Measures tool intent / funnel top |
| `file_accepted` | User drops/selects valid photo | `file_count`, `format_family` | Tracks accepted uploads by format (jpg, png, webp, heic) |
| `existing_gps_detected` | Photo uploaded with existing GPS EXIF | `format_family` | Measures share of photos that already had geotags |
| `map_location_selected` | User chooses location | `selection_method` (`"map_click"`, `"search"`, `"device_gps"`) | Measures preferred location entry mode (zero coordinates logged) |
| `manual_coordinates_entered` | User inputs DD or DMS coordinates directly | `coord_format` (`"dd"`, `"dms"`) | Measures manual coordinate entry format |
| `processing_started` | User clicks "Apply GPS" or "Download All" | `processing_mode` (`"single"`, `"batch"`), `item_count` | Funnel processing start |
| `processing_completed` | Geotagging + verification completes | `processing_mode`, `item_count`, `duration_ms`, `success_count` | Measures processing speed and completion rate |
| `verification_passed` | Round-trip EXIF check verifies GPS tags | `format_family` | Confirms successful local metadata write and readback |
| `verification_failed` | Round-trip check detects mismatch | `failure_category` | Diagnostics on verification integrity without coordinates |
| `download_completed` | User downloads single photo | `format_family`, `download_count` | Funnel conversion |
| `batch_download_completed` | User downloads ZIP batch archive | `download_count` | Funnel batch conversion |
| `gps_finder_used` | User inspects photo in GPS Finder | `has_gps` (boolean), `format_family` | Measures GPS Finder usage |
| `gps_finder_copied` | User copies coordinates from GPS Finder | `coord_format` (`"dd"`, `"dms"`) | Measures GPS Finder utility actions |

### C. Quality & Error Events
| Event Name | Trigger | Parameters | Description |
|---|---|---|---|
| `unsupported_format` | User drops an unsupported extension | `attempted_extension` | Tracks demand for additional formats (e.g. cr2, nef, avif) |
| `parsing_error` | Metadata decoding fails | `format_family`, `error_category` | Identifies corrupt or unreadable image headers |
| `writing_error` | Metadata encoding/injection fails | `format_family`, `error_category` | Tracks local write errors |
| `geocoder_error` | Geocoding API lookup returns no results | `error_category` | Diagnostics on geocoding service |
| `map_load_error` | Leaflet tile load failure | `map_layer` | Diagnostics on tile CDN availability |

---

## 4. Native Core Web Vitals Monitoring

FreeGeoTagger includes a native `PerformanceObserver` Web Vitals listener with zero external npm dependencies (`< 1.5 KB` uncompressed JS).

### Observed Metrics
| Metric | Full Name | Good Threshold | Needs Improvement | Poor Threshold | Observer Source |
|---|---|---|---|---|---|
| **LCP** | Largest Contentful Paint | $le 2500$ ms | $2501 - 4000$ ms | $> 4000$ ms | `largest-contentful-paint` |
| **CLS** | Cumulative Layout Shift | $le 0.10$ | $0.11 - 0.25$ | $> 0.25$ | `layout-shift` (excluding recent input) |
| **INP** | Interaction to Next Paint | $le 200$ ms | $201 - 500$ ms | $> 500$ ms | `first-input` & event duration |
| **FCP** | First Contentful Paint | $le 1800$ ms | $1801 - 3000$ ms | $> 3000$ ms | `paint` (`first-contentful-paint`) |
| **TTFB** | Time to First Byte | $le 800$ ms | $801 - 1800$ ms | $> 1800$ ms | `navigation` (`responseStart`) |

Event dispatched: `web_vital_measurement` with parameters:
- `vital_name`: `"LCP" | "CLS" | "INP" | "FCP" | "TTFB"`
- `vital_value`: numeric value (rounded)
- `vital_rating`: `"good" | "needs_improvement" | "poor"`

---

## 5. Google Consent Mode v2 & Cookie Banner

### Implementation Architecture
1. **Initial Script in `client/index.html`:**
   ```javascript
   gtag('consent', 'default', {
     'ad_storage': 'denied',
     'ad_user_data': 'denied',
     'ad_personalization': 'denied',
     'analytics_storage': 'denied',
     'wait_for_update': 500
   });
   ```
2. **Prior Consent Check:**
   Before Gtag script initializes, `localStorage.getItem('fgt-cookie-consent')` is checked. If `"accepted"`, consent is granted immediately to prevent flashing or re-prompting returning users.
3. **Interactive Cookie Banner (`client/src/components/cookie-consent.tsx`):**
   - Visible when no choice has been recorded.
   - "Accept" updates all 4 consent modes to `granted` and stores `"accepted"`.
   - "Decline" updates all 4 consent modes to `denied` and stores `"declined"`.
   - Fully accessible with WCAG 2.2 AA compliant contrast, aria-labels, and polite announcements.
