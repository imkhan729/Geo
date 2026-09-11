# Changelog

All notable changes to FreeGeoTagger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Phase 7: Nominatim Geocoder Hardening & Multi-Provider Architecture] - 2026-09-11

### Added
- Created `client/src/lib/geocoding/`:
  - `types.ts`: Decoupled provider interfaces (`PlaceResult`, `GeocoderProvider`, `MapPickerAdapter`, `GeocoderConfig`).
  - `cache.ts`: `GeocodingCache` with LRU capacity management, query normalization, and ~11m (4 decimal place) coordinate proximity rounding.
  - `rate-limiter.ts`: `RateLimiter` queue strictly enforcing OpenStreetMap Nominatim's 1 req/sec usage policy.
  - `nominatim-provider.ts`: Hardened direct Nominatim provider with query validation (min 3 chars), timeout guards (`AbortController` 6s), compliant User-Agent headers, and in-memory caching.
  - `photon-provider.ts`: High-speed OSM Elasticsearch geocoding provider (Komoot Photon) as an automatic zero-key secondary fallback.
  - `composite-provider.ts`: Resilient failover composite provider that queries primary first and transparently falls back to secondary on error or empty results.
  - `proxy-provider.ts`: Backend proxy provider that uses server `/api/geocode` endpoints when available and gracefully degrades to client-side direct providers on static hosting (Hostinger Apache).
  - `index.ts`: Unified module entry point, singleton `geocoder`, and provider swap registry (`getGeocoder()`, `setGeocoderProvider()`).
- Created `client/src/lib/maps/`:
  - `leaflet-adapter.ts`: Concrete implementation of `MapPickerAdapter` decoupling Leaflet DOM logic from UI components.
  - `index.ts`: Maps entry point and adapter exports.
- Created `server/geocoding.ts`:
  - Server-side geocoding service with in-memory caching, 1 req/sec rate limiting, and coordinate bounds validation.
- Added server API endpoints in `server/routes.ts`:
  - `GET /api/health`: Health status endpoint returning uptime, ISO timestamp, service identity, and version.
  - `GET /api/geocode/search`: Server-side geocoding search proxy with input validation.
  - `GET /api/geocode/reverse`: Server-side reverse geocoding proxy with lat/lng range validation.
  - `POST /api/indexnow`: IndexNow submission endpoint with host and URL list validation for Phase 11 readiness.
- Added `script/test-geocoder-provider.ts`:
  - Automated test suite covering rate limiter timing, LRU cache eviction, coordinate grouping, query rejection, failover, short-circuiting, proxy degradation, and server geocoding validation (8/8 tests passing).

### Enhanced
- Refactored `client/src/lib/geotag-utils.ts`:
  - Re-exported `PlaceResult` and aliased `PlaceSuggestion = PlaceResult` for 100% backward compatibility.
  - Delegated `searchPlaces(query)` and `reverseGeocode(query)` to `geocoder`, ensuring automatic rate limiting, caching, and fallback across the app.
  - Added `reverseGeocodeCoords(lat, lng)` helper.
- Consolidated legacy map components per `docs/MIGRATION_MAP.md`:
  - Refactored `client/src/components/geotag-map.tsx` to wrap `LeafletMap`.
  - Refactored `client/src/components/location-map.tsx` to wrap `LeafletMap` with `readOnly={true}`, eliminating duplicate Leaflet DOM and marker icon code.

---

## [Phase 6: GPS Finder Upgrade] - 2026-09-11

### Added
- Created `extractPhotoMetadata(dataUrl)` in `client/src/lib/geotag-utils.ts`: Extracts structured metadata (`ExtractedPhotoDetails`) including decimal latitude/longitude, altitude (meters and feet), DMS formatting (`dmsLat`, `dmsLng`, `dmsFormatted`), timestamp, camera make/model, software, and image descriptions across JPEG, PNG, and WebP images.
- Added `script/test-gps-finder.ts`: Comprehensive automated test suite with 6 tests verifying GPS extraction across JPEG, PNG `eXIf`, WebP EXIF, graceful handling of images without GPS, camera metadata extraction without GPS, and DMS $\leftrightarrow$ DD conversion fidelity.
- Added DD $\leftrightarrow$ DMS segmented display toggle in `/gps-finder`, allowing users to switch coordinate views and copy in their preferred notation.
- Added technical EXIF breakdown card displaying altitude (meters & feet), capture timestamp, and camera make/model.
- Added "Open in OpenStreetMap" link alongside "Open in Google Maps".
- Added dedicated, helpful "No GPS Location Found" state with photo thumbnail preview, detected camera metadata, clear explanation of why photos lack location data, and a 1-click CTA linking to `/` to geotag the photo.
- Added ARIA live region (`aria-live="polite"`) announcing extraction progress and results for screen readers.

### Enhanced
- Upgraded `client/src/components/tool/leaflet-map.tsx`: Added `readOnly` mode with custom brand pin, smooth zoom/pan, coordinate pill, and container responsiveness.
- Replaced inline Leaflet logic in `client/src/pages/gps-finder.tsx` with reusable `LeafletMap` component.
- Added semantic `<main id="main-content">` landmark and breadcrumbs (`Home` > `GPS Finder`).
- Added `WebApplication` Schema.org structured data aligned with prerendered SEO metadata.

---

## [Phase 5: Metadata Engine & Verification] - 2026-09-11

### Added
- Created binary verification engine `verifyGeotaggedBlob(blob, expected)` in `client/src/lib/geotag-utils.ts`:
  - Directly inspects binary file container integrity (JPEG APP1 marker and Exif header, PNG `eXIf` chunk structure and CRC32 verification, WebP VP8X header and EXIF chunk).
  - Re-reads and extracts GPS coordinates and altitude directly from output blob.
  - Computes geodesic distance difference between input target coordinates and serialized binary coordinates using Haversine formula (`calculateDistanceMeters`).
  - Enforces strict tolerance checks: geodesic error $< 5.0$m (or $< 0.0001^\circ$), altitude tolerance $\le 1.5$m, and chunk CRC32 matching.
- Implemented `addGeotagAndVerify(file, geotag)`: Complete write $\rightarrow$ re-read $\rightarrow$ binary verify loop providing verification diagnostics (`VerificationResult`).
- Added automated verification test suite `script/test-metadata-engine.ts` with 8 comprehensive automated test suites covering:
  - Haversine geodesic distance calculations.
  - DMS boundary over-rounding normalization ($40.999999^\circ \rightarrow 41^\circ 0' 0.00''$).
  - JPEG geotagging and binary verification loop.
  - PNG geotagging, `eXIf` chunk insertion, and CRC32 verification.
  - WebP geotagging, VP8X container update, and EXIF verification.
  - Equator and Prime Meridian hemisphere boundary handling ($(0.0, 0.0)$).
  - Southern and Western hemisphere handling (Buenos Aires: $-34.6037, -58.3816$).
  - Verification guardrails: catching coordinate and container mismatches ($> 10,851$ km).

### Enhanced
- Hardened EXIF payload writing in `addGeotagToImage`:
  - Added UTC `GPSDateStamp` (EXIF GPS tag 29) and `GPSTimeStamp` (EXIF GPS tag 7) for standards-compliant timestamp recording.
  - Normalized boundary condition handling in `degToDmsRational` and `decimalToDms` so fractional seconds cascade smoothly into minutes and degrees (seconds $< 60$, minutes $< 60$).
  - Handled multi-environment data URL parsing and MIME type fallbacks for both client-side browser execution and headless unit testing.
- Integrated `addGeotagAndVerify` into `client/src/pages/home.tsx` for individual file geotagging, batch processing, and ZIP archive packaging, attaching `VerificationResult` to UI items.

---

## [Phase 4: Homepage Core Tool UI] - 2026-09-11

### Added
- Created `client/src/components/tool/dropzone.tsx`: Modern, accessible drag-and-drop file uploader with keyboard activation (`Enter` / `Space`), format validation (JPG, PNG, WebP, HEIC), 20MB file limit enforcement, and distinct drag-hover visual states.
- Created `client/src/components/tool/file-queue.tsx`: Interactive photo queue displaying thumbnail previews, human-readable file sizes, format badges, metadata status badges ("Existing GPS Detected" vs "No GPS", "Ready", "Processing", "Verified / Tagged"), active image selection, individual photo removal, and individual photo download.
- Created `client/src/components/tool/coordinate-panel.tsx`: Comprehensive coordinate control panel featuring Decimal Degrees (DD) $\leftrightarrow$ Degrees, Minutes, Seconds (DMS) two-way synchronized inputs, optional altitude entry (meters), debounced 500ms place search with autocomplete suggestions, opt-in "Use My Location" geolocation detection, "Use Photo's GPS" recall, and one-click coordinate copying with feedback.
- Created `client/src/components/tool/leaflet-map.tsx`: Dynamic lazy-loaded interactive Leaflet map with custom-styled brand marker, draggable pin syncing coordinates on `dragend`, click-to-reposition, smooth animated panning on coordinate change, and floating coordinate overlay pill.
- Created `client/src/components/tool/batch-actions.tsx`: Action toolbar with "Apply GPS to Photo / All Photos", "Download Geotagged Photo / All as ZIP", batch progress bar (`role="progressbar"`) with animated percentage and status text, and client-side privacy guarantee.
- Added coordinate and metadata helpers in `client/src/lib/geotag-utils.ts`: `decimalToDms`, `dmsToDecimal`, `formatCoordinates`, `formatFileSize`, and altitude support in `GeotagData` and `addGeotagToImage`.

### Enhanced & Unified
- Rebuilt `client/src/pages/home.tsx`: Unified hero and tool presentation above the fold (`Free Geotagger — Add GPS Location to Photos Online`), with one-sentence value proposition and prominent privacy badge, while keeping all below-the-fold educational and SEO content (What is FreeGeoTagger, What is Image Geotagging, Privacy, Features, Use Cases, How It Works, Comparison Table, and FAQ) visible and interactive at all times.
- Aligned static prerendering H1 in `script/generate-seo-pages.ts` with runtime React H1 (`Free Geotagger — Add GPS Location to Photos Online`) for 100% SERP and crawler consistency.
- Verified coordinate conversion math with unit tests covering North/South/East/West hemispheres, decimal rational roundtrips, formatters, and edge cases.

---

## [Phase 3: Design System + Layout Foundation] - 2026-09-11

### Added
- Created `client/src/components/skip-link.tsx`: Accessible skip-to-content mechanism for WCAG 2.2 AA (SC 2.4.1 Bypass Blocks).
- Created `client/src/components/tool-shell.tsx`: Standardized tool wrapper providing responsive layout (`max-w-6xl`), breadcrumbs, semantic `<main id="main-content">`, and clear title hierarchy.
- Created `client/src/components/info-callout.tsx`: Reusable accessible notice/callout with `info`, `warning`, `success`, and `privacy` variants, complete with semantic roles and high-contrast iconography.
- Created `client/src/components/tool-comparison-table.tsx`: Clean, accessible responsive comparison table with `<caption class="sr-only">`, proper scope headers, and horizontal overflow protection for mobile screens (320px–412px).
- Created `docs/ACCESSIBILITY.md`: Comprehensive accessibility specification and WCAG 2.2 Level AA audit covering contrast ratios, keyboard navigation, touch target compliance, and mobile breakpoints.
- Added `info` and `success` variants to `client/src/components/ui/alert.tsx`.

### Enhanced & Optimized
- Refactored `tailwind.config.ts` component radius to adhere strictly to the 12–16px specification (`lg: 14px`, `xl: 16px`, `2xl: 16px`, `md: 12px`, `sm: 10px`).
- Enhanced `client/src/components/ui/button.tsx` with sharp focus-visible rings (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) and thumb-friendly touch targets (`min-h-10` / 40px, `min-h-12` / 48px).
- Enhanced `client/src/components/Header.tsx` with semantic `role="banner"`, embedded `<SkipLink>`, focus-visible indicators, and minimum 44px touch targets on mobile navigation items.
- Enhanced `client/src/components/Footer.tsx` with semantic `role="contentinfo"`, focus indicators, and accessible link padding.
- Verified color contrast ratios across all surfaces: Body text (13.4:1), Primary green (5.3:1), and Muted text (5.4:1), all meeting or exceeding WCAG 2.2 AA standards.

---

## [Phase 2: Architecture Decision + Safe Refactor Plan] - 2026-09-11

### Added
- Comprehensive architecture decisions documented in `docs/ARCHITECTURE.md`.
- Evaluated framework options (Next.js App Router vs In-Place Vite + React + TS + Static Prerender) and formalized the decision to improve in place, eliminating framework churn risk, preserving zero-server hosting on Hostinger Apache, and safeguarding organic search rankings.
- Defined explicit Server vs Client boundaries, local image processing boundaries, and memory management rules (`URL.createObjectURL` / `URL.revokeObjectURL`).
- Designed map and geocoder provider abstraction contracts (`GeocoderProvider` and `MapPickerAdapter` interfaces).
- Defined telemetry and analytics boundaries ensuring strict data minimization under Google Consent Mode v2.
- Designed future zero-CLS `AdSlot` architecture and established strict restricted tool zones for Phase 16 monetization readiness.
- Formalized the 20-phase sequential refactor roadmap from Design System (Phase 3) through Post-Launch Monitoring (Phase 20).

---

## [Phase 1: Repository + Production Audit] - 2026-09-11

### Added
- Created `docs/ARCHITECTURE.md` documenting current technical stack, Hostinger Apache deployment pipeline, prerendering/client hydration engine, metadata manipulation flow, map/geocoding architecture, and privacy invariants.
- Created `docs/SEO_BASELINE.md` recording settled Search Console metrics (273 clicks / 5,016 impressions / 5.44% CTR / 17.95 average position through 2026-09-08), core query rankings (`geotagger` pos 4.34, `geo tagger` pos 4.89, `geotag free` pos 5.21, `geotagger online` pos 7.84), canonical route status, and SEO guardrails.
- Created `docs/MIGRATION_MAP.md` mapping all 17 canonical routes, component refactoring priorities, dependency pruning candidates, and rollback procedures.
- Created `PROJECT_STATUS.md` and `docs/PROJECT_STATUS.md` tracking phase progress, test verification, and known risks.

### Verified & Audited
- Audited live site at `https://freegeotagger.com` and confirmed complete 1-to-1 route parity with repository build output (17 canonical URLs returning HTTP 200).
- Validated production build pipeline (`npm run check` and `npm run build`), confirming zero TypeScript errors and successful generation of 16 prerendered static SEO route pages plus home page prerender.
- Audited metadata via `script/validate-meta.ts`, verifying 17/17 titles (50–60 chars) and meta descriptions (140–160 chars) are within SERP limits and globally unique.
- Verified SEO health via `script/seo-check.mjs dist/public`, finding 0 high-severity and 0 medium-severity issues.
- Confirmed privacy-first architecture: zero user images, coordinates, or EXIF metadata leave the client browser.
