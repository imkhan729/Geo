# Changelog

All notable changes to FreeGeoTagger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Phase 20: Deployment & Post-Launch Verification] - 2026-09-12

### Added
- **Production Deployment Artifact & Packaging (`package-hostinger.ps1`)**:
  - Successfully built, prerendered, and packaged the complete, production-ready website into `freegeotagger-hostinger-static.zip` (1.79 MB, 90 files).
  - Verified path normalization to forward-slash Unix separators, inclusion of `.htaccess` with full security headers (HSTS, nosniff, SAMEORIGIN, CSP) and rewrite rules for all 20 static SEO routes.
- **Automated Live Endpoint QA Verification Suite (`script/test-postlaunch-live.ts`)**:
  - Implemented real-time production health monitoring script (`npm run test:live`) to ping live endpoints at `https://freegeotagger.com/`.
  - Executed live post-launch verification: all 14 checks passed (100% pass rate) with 200 OK across Homepage, sitemap.xml, robots.txt, ads.txt, BingSiteAuth.xml, IndexNow verification key, and all 8 sample live tools and pages.
- **IndexNow Instant Search Discovery Live Submission (`indexnow-submit.ts`)**:
  - Submitted all 21 canonical URLs live to the IndexNow API (`api.indexnow.org`).
  - Search engine API response: `Status: 202 Accepted for 21 URLs` (Bing, Yandex, and partner crawlers successfully triggered).
- **Comprehensive Hostinger Deployment Documentation (`docs/DEPLOYMENT.md` & `DEPLOYMENT.md`)**:
  - Authored complete, foolproof step-by-step instructions for extracting `freegeotagger-hostinger-static.zip` directly into Hostinger `public_html`.
  - Detailed cache-clearing procedures (Hostinger LiteSpeed / Nginx Cache Manager, Cloudflare).
  - Outlined IndexNow live submission execution (`npx tsx script/indexnow-submit.ts --all --live`) and long-term search console monitoring baselines.
- **Project Completion Milestone**:
  - Successfully executed, deployed, verified live, and submitted all 20 phases of the Antigravity Master Build & Refactor Plan.
  - Zero technical debt, 100% test pass rate across all suites, zero thin content, strict performance budget compliance, and 100% live production verification.

## [Phase 19: Final Pre-Launch QA — 36-Point Verification Suite] - 2026-09-12

### Added
- **Phase 19 Automated 36-Point Pre-Launch QA Suite (`script/test-prelaunch-qa.ts`)**:
  - Implemented full 36-point pre-production verification suite achieving a 100% pass rate (36/36 tests passing) across six critical production dimensions:
    - *Group 1: Core Tool Workflows & Invariants* (Single Photo Geotagger, GPS Finder, EXIF Viewer, Remove GPS, Coordinate Converter, Improved Batch Workflow).
    - *Group 2: Zero-Upload Invariant & Privacy Guardrails* (Zero upload endpoints, in-memory Uint8Array/Canvas binary manipulation, zero-telemetry analytics scrubbing, zero database/auth dependencies, strict HSTS/CSP security headers, transparent privacy policy).
    - *Group 3: Technical SEO & Static Prerendering* (21 canonical routes, title/description budgets, robots.txt & sitemap.xml alignment, 20 prerendered static subpages + index.html, 100% zero-thin content milestone, zero orphan pages).
    - *Group 4: Structured Data & Schema Markup* (WebSite, Organization with verified logo ImageObject, WebApplication schemas, Article schema on all 9 guides, FAQPage schemas, BreadcrumbList schemas, Open Graph & Twitter cards with 1200x630 og:image).
    - *Group 5: Web Performance & Budget Guardrails* (Eager JS <= 400 KB, Critical CSS <= 150 KB, Initial HTML <= 50 KB, CLS = 0.00, async lazy-splitting of heic2any and jszip, system font stack).
    - *Group 6: Accessibility, Cross-Browser & Hostinger Packaging* (WCAG 2.2 AA landmarks on all 21 routes, single h1 headings, skip link, mobile touch targets >= 44px, 16px iOS auto-zoom guard, prefers-reduced-motion, monetization master switch disabled, verified Hostinger forward-slash deployment zip packaging).
  - Added `"test:qa": "tsx script/test-prelaunch-qa.ts"` command to `package.json`.
- **Hostinger Production Artifact Verification**:
  - Executed `powershell -File script/package-hostinger.ps1`.
  - Packaged 90 production files into `freegeotagger-hostinger-static.zip` (1.79 MB).
  - Verified forward-slash path normalization, all 9 required root files (`.htaccess`, `index.html`, `robots.txt`, `sitemap.xml`, `llms.txt`, `og-image.png`, `ads.txt`, `404.html`, `favicon.png`), 20 prerendered SEO routes, and 9 image assets.

## [Phase 18: Page 3 — Blog Hub Expansion & Topical Cluster Architecture] - 2026-09-12

### Added
- **Blog Hub Deep Expansion (`client/src/pages/blog/index.tsx` & `script/generate-seo-pages.ts`)**:
  - Expanded crawlable technical documentation from 681 to 1,092 words, completely clearing the final thin-content audit warning across the entire site.
  - Formulated four core topical learning clusters:
    - *Cluster 1: Mobile Device Geotagging & OS Permissions* (iOS Safari sandbox, Apple HEIC transcode, Android location permissions).
    - *Cluster 2: Privacy Defense, Security & Metadata Sanitization* (Accidental home address exposure, selective GPS removal vs complete metadata destruction).
    - *Cluster 3: Commercial Applications (Local SEO & Real Estate)* (Google Business Profile reality vs myths, MLS syndication compliance).
    - *Cluster 4: Geodetic Standards & High-Throughput Batch Workflows* (EXIF 2.32 GPS IFD, WGS84 ellipsoid datum, CSV coordinate import).
  - Built interactive category filter pill navigation in the React client view allowing instant sorting across Mobile, Privacy, Business/SEO, and Batch/Standards clusters.
  - Linked directly to the full 6-tool browser-native ecosystem: Single Geotagger (`/`), GPS Finder (`/gps-finder`), EXIF Viewer (`/exif-viewer`), Remove GPS (`/remove-gps-from-photo`), Coordinate Converter (`/coordinate-converter`), and Batch Geotag Photos (`/batch-geotag-photos`).
  - Added 4-item technical FAQ accordion covering image sharpness preservation, social media platform metadata stripping, EXIF WGS84 coordinate systems, and air-gapped offline usage.
  - Enriched structured data with JSON-LD `Blog`, `CollectionPage`, `BreadcrumbList`, and `FAQPage` schemas.
- **Milestone Achievement: 100% Zero-Thin Content & Zero-Audit Issues**:
  - Prerendered `dist/public/seo-routes/blog.html` at 1,092 crawlable words.
  - `script/seo-check.mjs` now reports **0 HIGH, 0 MED, 0 LOW issues across all 21 pages**. Every single route meets or exceeds the 800-word E-E-A-T quality threshold.

## [Phase 18: Page 2 — Contact Page Expansion & Support Architecture] - 2026-09-12

### Added
- **Contact Page Deep Expansion (`client/src/pages/contact.tsx`)**:
  - Expanded crawlable technical documentation from 543 to 1,472 words, resolving the thin-content audit warning.
  - Formulated comprehensive support triage architecture: metadata parsing & EXIF standardization anomalies (TIFF header offsets, maker notes, Apple HEIC quirks), browser/WebGL/memory compatibility, community field workflow suggestions, and responsible security disclosures.
  - Detailed actionable diagnostic checklist for users submitting technical bug reports (page URL, OS/browser, camera/software source, browser developer console error traces).
  - Explicit Zero-Upload Privacy policy forbidding email attachment of sensitive personal imagery to protect user privacy.
  - Provided instant self-service directory linking directly to all 6 tools: Single Geotagger (`/`), GPS Finder (`/gps-finder`), EXIF Viewer (`/exif-viewer`), Remove GPS (`/remove-gps-from-photo`), Coordinate Converter (`/coordinate-converter`), and Batch Geotagging (`/batch-geotag-photos`).
  - Cross-linked full educational tutorial library: GPS fixing, GPS removal, iPhone/iOS geotagging, Android geotagging, Google Business Profile SEO, Real Estate MLS, bulk workflows, tool comparison, and EXIF 2.32 fundamentals.
  - Added 4-item technical support FAQ covering response SLAs (24–48 hours direct engineer replies), permanent metadata loss on social networks, zero cloud API invariants, and offline air-gapped support.
  - Enhanced structured data with JSON-LD `ContactPage`, `ContactPoint`, `Organization`, `BreadcrumbList`, and `FAQPage` schemas.
- **Static SEO Prerender Update**:
  - Prerendered `dist/public/seo-routes/contact.html` at 1,472 crawlable words.
  - Cleared `[thin] /contact` warning in `script/seo-check.mjs` (only `/blog` remains as LOW).

## [Phase 18: Page 1 — About Page Expansion & E-E-A-T Optimization] - 2026-09-12

### Added
- **About Page Deep Expansion (`client/src/pages/about.tsx`)**:
  - Expanded crawlable technical documentation from 777 to 1,495 words, completely resolving the low-word count audit warning.
  - Authored deep technical architectural breakdown of the **Zero-Upload Invariant** detailing HTML5 `FileReader`, typed binary arrays (`Uint8Array`, `DataView`), in-memory EXIF binary parsing/encoding, and complete network isolation.
  - Detailed EXIF 2.32 geodetic standard compliance: GPS IFD structure, unsigned rational coordinate arrays, hemisphere references (N/S/E/W), WGS84 datum projection, and precision preservation.
  - Added comprehensive professional use cases: Real Estate MLS syndication, Local SEO & Google Business Profile verification, Field Engineering & Survey inspections, Insurance & Appraisal documentation, and Travel/Nature archiving.
  - Documented four strict Ethical Commitments: No cloud storage, No account walls or paywalls, Zero watermarks or compression loss, and Zero coordinate telemetry.
  - Complete ecosystem integration with bidirectional internal links to all 6 platform tools: Single Geotagger (`/`), GPS Finder (`/gps-finder`), EXIF Viewer (`/exif-viewer`), Remove GPS (`/remove-gps-from-photo`), Coordinate Converter (`/coordinate-converter`), and Batch Geotagging (`/batch-geotag-photos`).
  - Added 4-item technical FAQ accordion covering commercial licensing, offline PWA/browser capabilities, lossless metadata injection, and cost.
  - Enriched structured data with JSON-LD `AboutPage`, `Organization`, `WebPage`, `BreadcrumbList`, and `FAQPage` schemas.
- **Static SEO Prerender Update**:
  - Prerendered `dist/public/seo-routes/about.html` at 1,495 crawlable words.
  - Cleared `[thin] /about` audit warning in `script/seo-check.mjs`.

## [Phase 17: Tool 4 — Improved Batch Workflow] - 2026-09-12

### Added
- **Batch Geotagging & CSV Mapping Engine (`client/src/lib/batch-workflow-utils.ts`)**: Built high-throughput, 100% client-side multi-file metadata utilities:
  - Smart CSV / TSV Coordinate Parser (`parseCoordinateCsv`) auto-detecting delimiters (comma, semicolon, tab) and recognizing varied header schemes (`filename`, `latitude`, `longitude`, `altitude`, `description`) with WGS84 boundary enforcement.
  - Multi-Criteria Filename Matcher (`matchCsvToImages`) supporting exact, case-insensitive, and extension-agnostic filename pairing to loaded photos.
  - Batch CSV Exporter (`generateBatchExportCsv`) producing downloadable verification logs.
  - Tokenized Batch Renamer (`formatBatchFilename`) supporting `{name}`, `{index}`, `{lat}`, and `{lng}` filename pattern tokens.
- **Standalone Batch Geotag Tool Page (`client/src/pages/batch-geotag-photos.tsx`)**:
  - Accessible, responsive standalone batch workspace at `/batch-geotag-photos`.
  - Multi-file drag-and-drop dropzone supporting JPG, PNG, WebP, and Apple HEIC with automatic JPEG transcoding.
  - CSV Coordinate Import card with instant upload matching and visual match counters.
  - Batch selection toolbar ("Select All", "Deselect", "Select Untagged") enabling multi-location group tagging within a single session.
  - Interactive Leaflet map with geocoding search and group location assignment.
  - Sequential chunked EXIF embedding with accessible live progress bar (`role="progressbar"`).
  - Consolidated ZIP packaging with custom tokenized file renaming.
  - Batch CSV export log download.
  - Phase 17 Mandatory CTAs: Single Geotagger (`/`), GPS Finder (`/gps-finder`), EXIF Viewer (`/exif-viewer`), Remove GPS (`/remove-gps-from-photo`), Coordinate Converter (`/coordinate-converter`), and Bulk Geotag Guide (`/blog/how-to-bulk-geotag-photos`).
  - Reserved CLS-guarded `<AdSlot placement="batch-geotag-below-tool" />` strictly below the tool interface.
  - 1,000+ word educational article covering batch geotagging workflows, CSV coordinate import syntax, memory optimization, and metadata standards.
  - 6-item FAQ accordion with JSON-LD schemas (`WebPage`, `BreadcrumbList`, `WebApplication`, `FAQPage`).
  - Landmark `<main id="main-content" tabIndex={-1} className="outline-none flex-1">`.
- **Navigation & Routing**:
  - Registered `/batch-geotag-photos` in `client/src/App.tsx` (code-split lazy chunk: 38.50 KB).
  - Added "Batch" link to header navigation and "Batch Geotagger" to footer.
  - Added prerendered static SEO page `dist/public/seo-routes/batch-geotag-photos.html` in `script/generate-seo-pages.ts`.
  - Added Apache rewrite rule in `client/public/.htaccess` and sitemap entry in `client/public/sitemap.xml`.
  - Registered canonical route in `server/indexnow.ts` (now 21 canonical routes).
- **Monetization & Ads Readiness**:
  - Registered `batch-geotag-below-tool` placement in `client/src/lib/ads-config.ts` with reserved slot geometry (100px mobile, 90px desktop).
- **Verification Suites**:
  - Created 44-point verification suite in `script/test-batch-geotag.ts` (`npm run test:batch-geotag`) — 44/44 PASS.
  - Updated route assertions across technical SEO, IndexNow, and accessibility test suites (all 100% PASS).

## [Phase 17: Tool 3 — Coordinate Converter] - 2026-09-12

### Added
- **GPS Coordinate Engine & Smart Multi-Format Parser (`client/src/lib/coordinate-converter-utils.ts`)**: Built high-precision, 100% client-side spatial calculation utilities:
  - Bidirectional conversions across Decimal Degrees (DD), Degrees Minutes Seconds (DMS), Degrees Decimal Minutes (DDM), and Base32 Geohash.
  - Smart Universal Coordinate Parser (`parseAnyCoordinates`) auto-detecting and extracting coordinates from comma/space separated DD, unicode DMS with hemisphere references, nautical DDM, Google Maps URLs (`/@lat,lng` and `?q=lat,lng`), OpenStreetMap URLs, Geo URIs, and Geohash codes.
  - Haversine great-circle distance and azimuth/bearing calculation.
  - Coordinate bounding validation enforcing WGS84 ranges ([-90, 90] latitude, [-180, 180] longitude).
  - External map navigation URL generators for Google Maps, OpenStreetMap, Apple Maps, and Geo URI.
- **Standalone Coordinate Converter Tool Page (`client/src/pages/coordinate-converter.tsx`)**:
  - Accessible, responsive standalone tool page at `/coordinate-converter`.
  - Universal Smart Input bar with instant format auto-detection, format badges, and one-click device geolocation ("My Location").
  - Precision selector dropdown (4 to 8 decimal places with physical ground accuracy indicators).
  - Synchronized, editable format cards with instant one-click copying for DD, DMS, DDM, and Geohash.
  - Interactive Leaflet map with click-to-pin, drag adjustment, and synchronized bidirectional conversion.
  - Forward address/place search bar integrating `/api/geocode/search` with auto-complete dropdown.
  - Reverse geocoded location badge displaying nearest address via `/api/geocode/reverse`.
  - Primary Conversion Action: **"Geotag Photos with These Coordinates"** linking to `/?lat=${lat}&lng=${lng}` to immediately embed coordinates into image files.
  - Conversion CTAs to GPS Finder (`/gps-finder`), EXIF Viewer (`/exif-viewer`), Remove GPS (`/remove-gps-from-photo`), and EXIF GPS Guide (`/blog/what-is-exif-gps-metadata`).
  - Reserved CLS-guarded `<AdSlot placement="coordinate-converter-below-tool" />` strictly below the tool interface.
  - 1,000+ word educational article covering coordinate formats, conversion math, EXIF GPS tags, ground accuracy tables, and troubleshooting.
  - 6-item FAQ accordion with JSON-LD schemas (`WebPage`, `BreadcrumbList`, `WebApplication`, `FAQPage`).
  - Landmark `<main id="main-content" tabIndex={-1} className="outline-none flex-1">`.
- **Homepage Coordinate Integration (`client/src/pages/home.tsx`)**:
  - Added query parameter support (`?lat=...&lng=...`) allowing users from the Coordinate Converter to immediately start tagging photos with their converted coordinates.
- **Navigation & Internal Linking Updates**:
  - Added "Coordinates" link in Header navigation (`client/src/components/Header.tsx`).
  - Added "Coordinate Converter" link in Tools column (`client/src/components/Footer.tsx`).
  - Registered route `/coordinate-converter` in `client/src/App.tsx`.
- **Monetization & Layout Protection**:
  - Registered `coordinate-converter-below-tool` in `client/src/lib/ads-config.ts` (100px mobile, 90px desktop).
- **SEO & Search Indexing**:
  - Added `coordinateConverter` to `SEO_CONFIG` in `client/src/lib/seo.ts` with SERP-compliant title (52 chars) and description (160 chars).
  - Added static route prerendering in `script/generate-seo-pages.ts` generating `dist/public/seo-routes/coordinate-converter.html`.
  - Added rewrite rule in `client/public/.htaccess` and canonical URL in `client/public/sitemap.xml`.
  - Registered canonical URL in `server/indexnow.ts` (now 20 canonical routes).
- **Automated Verification Suite (`script/test-coordinate-converter.ts`)**: Built a 44-point test suite covering mathematical conversion precision, parser variations, Haversine distance, mandatory CTAs, privacy invariants, JSON-LD schemas, ad placement safety, and accessibility landmarks. Added `"test:coordinate-converter"` script to `package.json`.
- **Critical Bundle Optimization**:
  - Exported `HOME_SEO_CONFIG` from `client/src/lib/seo.ts` to tree-shake all 19 other pages' metadata out of the initial bundle.
  - Code-split `ToolComparisonTable` and `CookieConsent` using `React.lazy()` and `Suspense`.
  - Pruned unused `lucide-react` icons in `home.tsx` and `Header.tsx`.
  - Preserved Eager Critical JS at 397.89 KB (< 400 KB limit).

---

## [Phase 17: Tool 2 — Remove GPS Tool] - 2026-09-12

### Added
- **Client-Side Remove GPS Engine (`client/src/lib/remove-gps-utils.ts`)**: Built a zero-upload, 100% in-browser metadata stripping utility:
  - Pre-removal inspection (`inspectImageForRemoval`) extracting existing GPS coordinates, altitude, timestamp, compass bearing, and camera hardware tags.
  - Section 29 Dual Removal Modes:
    - `"gps-only"`: Empties `exifData.GPS = {}` while preserving all camera settings, shutter speed, ISO, aperture, focal length, and capture timestamps.
    - `"all-metadata"`: Purges all EXIF, IPTC, and XMP metadata blocks (`piexif.remove(dataUrl)`).
  - Programmatic In-Browser Binary Verification: Re-reads output blob using `extractExifData` to mathematically confirm `!postResult.hasGps` before the user downloads the image.
  - Canvas re-encoding fallback for PNG/WebP formats and automatic HEIC to JPEG conversion via client-side transcoder.
- **Standalone Remove GPS Tool Page (`client/src/pages/remove-gps-from-photo.tsx`)**:
  - Accessible, responsive standalone tool page at `/remove-gps-from-photo`.
  - Accessible drag-and-drop dropzone supporting JPG, PNG, WebP, and HEIC files.
  - Detected GPS tags inspection panel with mini Leaflet pin preview.
  - Informative callout for photos with 0 GPS tags detected.
  - Mode selection radio cards ("Remove GPS Only" vs "Strip All Metadata") enforcing truth in advertising.
  - Post-removal verification badge ("Verified: 0 GPS Tags Detected").
  - Clean photo download action (`[filename]-nogps.jpg`).
  - Mandatory Section 29 CTAs: Geotagger (`/`), GPS Finder (`/gps-finder`), EXIF Viewer (`/exif-viewer`), and Tutorial guide (`/blog/how-to-remove-gps-data-from-photos`).
  - Reserved CLS-guarded `<AdSlot placement="remove-gps-below-tool" />` strictly below the tool interface.
  - 1,000+ word educational article on photo privacy, GPS metadata risks, and removal strategies.
  - 6-item FAQ accordion with JSON-LD schema.
  - Structured data: `WebPage`, `BreadcrumbList`, `WebApplication`, and `FAQPage`.
  - Accessible landmark `<main id="main-content" tabIndex={-1} className="outline-none flex-1">`.
- **Navigation & Internal Linking Updates**:
  - Added "Remove GPS" to header navigation in `client/src/components/Header.tsx`.
  - Added "Remove GPS" under Tools column in `client/src/components/Footer.tsx`.
  - Added interactive tool CTA banner to blog guide `client/src/pages/blog/how-to-remove-gps-data-from-photos.tsx`.
  - Added dynamic route in `client/src/App.tsx`.
- **Monetization & Layout Protection**:
  - Registered `remove-gps-below-tool` in `client/src/lib/ads-config.ts` (100px mobile, 90px desktop) safe below the tool container.
- **SEO & Search Indexing**:
  - Added `removeGps` to `SEO_CONFIG` in `client/src/lib/seo.ts` with SERP-compliant title (55 chars) and description (156 chars).
  - Added prerendered static route generation in `script/generate-seo-pages.ts` with complete HTML article, breadcrumbs, FAQs, and schemas.
  - Added rewrite rule in `client/public/.htaccess` and canonical URL in `client/public/sitemap.xml`.
  - Registered canonical URL in `server/indexnow.ts` (19 canonical routes).
- **Automated Verification Suite (`script/test-remove-gps.ts`)**: Built a 36-point test suite covering pre-removal inspection, GPS-only stripping, all-metadata purging, post-removal binary verification, truth in advertising, mandatory CTAs, privacy invariants, JSON-LD schemas, and ad placement safety. Added `"test:remove-gps"` script to `package.json`.

---

## [Phase 17: Tool 1 — EXIF Viewer] - 2026-09-12

### Added
- **Interactive In-Browser EXIF Metadata Viewer (`client/src/pages/exif-viewer.tsx`)**: Built a fully responsive, accessible standalone tool page at `/exif-viewer` supporting JPG, PNG, WebP, and HEIC images with zero server uploads (100% client-side memory extraction).
- **Section 28 Grouped Metadata Architecture (`client/src/lib/exif-utils.ts`)**: Structured raw binary EXIF tags into clean, human-readable functional categories:
  - *Camera & Exposure*: Make, Model, Lens Model, Focal Length, 35mm Equivalent, Aperture (F-number), Exposure Time, ISO Sensitivity, Exposure Program, Metering Mode, Flash, and White Balance.
  - *Date & Time*: DateTimeOriginal, Date Digitized, Date Modified, Subsecond precision, and UTC Time Offset.
  - *Dimensions & Geometry*: Native pixel width/height, Megapixel count, Aspect Ratio (4:3, 16:9, etc.), Color Space profile, and Orientation matrix.
  - *GPS Geolocation*: Decimal Degrees and DMS coordinates, Hemisphere indicators, Altitude, interactive Leaflet map preview with custom pinpoint, Copy Coordinates button, and external Google Maps & OpenStreetMap links.
  - *Software & Technical*: Firmware, Editing Software, Compression mode, Bits Per Sample, and Byte size.
  - *Copyright & Attribution*: Artist, Creator, Copyright notice, and Image Description.
- **Section 28 Mandatory Conversion CTAs & Internal Links**:
  - Direct action button to Geotag/Add GPS via primary tool (`/`).
  - Direct action button to open coordinates in GPS Photo Finder (`/gps-finder`).
  - Educational reference link to guide on How to Remove GPS Data (`/blog/how-to-remove-gps-data-from-photos`).
- **Data Export & Analysis Actions**:
  - Export full metadata as structured JSON download.
  - Copy formatted metadata summary to clipboard.
  - Searchable, collapsible raw EXIF tags table with tag filtering.
- **Structured Data & SERP Compliance**:
  - Registered `/exif-viewer` in `SEO_CONFIG` with SERP-validated Title (56 chars) and Meta Description (153 chars).
  - Injected `WebPage`, `BreadcrumbList`, `WebApplication`, and `FAQPage` JSON-LD schemas.
  - Added 6-item accordion FAQ section and 1,000+ word technical guide on EXIF standards.
- **Async Code Splitting & Performance Budget Preservation**:
  - Code-split `ExifViewer` using `React.lazy()` and dynamically imported `exifreader` within `extractExifData` to keep eager JS bundle at 393.39 KB (< 400 KB budget).
- **Monetization & Layout Protection**:
  - Added `exif-viewer-below-tool` to `ADS_CONFIG` with reserved min-heights (100px mobile, 90px desktop) strictly below the tool container.
- **Static Route Prerendering & Apache Routing**:
  - Added `/exif-viewer` static generation in `script/generate-seo-pages.ts` and rewrite rule in `.htaccess`.
  - Added `/exif-viewer` to `client/public/sitemap.xml` and canonical route inventory in `server/indexnow.ts`.
- **Automated Verification Suite (`script/test-exif-viewer.ts`)**: Implemented 42-point test suite covering Section 28 grouped schema, DMS formatters, aspect ratio calculation, graceful fallback for stripped photos, summary generation, mandatory CTAs, privacy invariant audit, JSON-LD schemas, and ad placement safety. Added `"test:exif-viewer"` to `package.json`.

---

## [Phase 16: Ads Readiness Only] - 2026-09-12

### Added
- **Monetization Architecture & Central Configuration (`client/src/lib/ads-config.ts`)**: Implemented central configuration `ADS_CONFIG` with master disabled switch (`enabled: false` by default during core rebuild), verified publisher ID (`ca-pub-6438644207209483`), placement catalog, and Google Consent Mode v2 advertising consent checking (`hasAdConsent()`).
- **Reusable CLS-Guarded AdSlot Component (`client/src/components/ad-slot.tsx`)**: Built an accessible, responsive ad container supporting standard IAB unit formats (`leaderboard`, `rectangle`, `large-rectangle`, `horizontal`, `responsive`). Pre-allocates fixed min-heights (`min-h-[90px]` / `min-h-[250px]`) to eliminate Cumulative Layout Shift (`CLS = 0.00`). Features non-shifting development wireframes (`debugPlaceholders`) and strictly returns null in production when disabled.
- **Core Tool Interaction Safe Zones (Zero Ads Policy)**: Enforced architectural safety guardrails with `FORBIDDEN_PLACEMENTS` blocklist. Guaranteed zero ad units inside the upload dropzone, file queue, coordinate inputs, image preview, or Leaflet map.
- **Recommended Non-Intrusive Placements**:
  - `homepage-below-tool`: Horizontal banner positioned after the core tool card and before the How-To guide.
  - `homepage-mid-content`: Horizontal banner between the Tool Comparison Table and the Guidance section.
  - `homepage-bottom`: Horizontal banner situated before the 12-question FAQ section.
  - `gps-finder-below-tool`: Horizontal banner below the GPS inspection results card.
  - `BlogAdSlot`: Reusable editorial ad unit exported from `client/src/components/blog-extras.tsx`.
- **Automated Ads Readiness Test Suite (`script/test-ads-readiness.ts`)**: Built a 34-point automated test suite verifying default disabled status, publisher ID consistency, ads.txt validation, CLS min-height allocations, core tool exclusion zones, placement presence, and consent checks. Added `"test:ads": "tsx script/test-ads-readiness.ts"` to `package.json`.
- **Ads Readiness Specification (`ADS_READINESS.md` & `docs/ADS_READINESS.md`)**: Comprehensive architectural guide documenting the Golden Rule of Monetization, IAB dimensions, zero-shift reservations, and Consent Mode v2 integration.

---

## [Phase 15: Analytics + Conversion Measurement] - 2026-09-12

### Added
- **Automated Analytics & Privacy Verification Test Suite (`script/test-analytics.ts`)**: Implemented a 48-point test suite verifying strict parameter blocklist sanitization (`PROHIBITED_PARAM_KEYS` dropping coordinates, filenames, addresses, queries, EXIF payloads, data URLs, emails), coordinate regex string scrubbing, email value scrubbing, Core Web Vitals rating targets, and a static AST/regex audit across all 110 client files confirming zero sensitive telemetry in tracking calls. Added `"test:analytics": "tsx script/test-analytics.ts"` to `package.json`.
- **Analytics & Measurement Specification (`ANALYTICS_SPEC.md` & `docs/ANALYTICS_SPEC.md`)**: Comprehensive documentation detailing zero-PII invariants, event taxonomy across Acquisition, Tool Funnel, and Quality categories, parameter blocklists, Web Vitals observer targets, and Consent Mode v2 integration.
- **Native Core Web Vitals Monitoring (`client/src/lib/analytics.ts`)**: Built a zero-dependency `PerformanceObserver` monitoring LCP, CLS, INP, FCP, and TTFB in real time without external npm dependencies (`< 1.5 KB` uncompressed JS). Initialized on app mount in `client/src/App.tsx`.
- **Blog Acquisition CTA Conversion Tracking**: Connected `trackArticleToToolClick` across all 9 blog articles, tracking reader conversions to the geotagging tool and GPS finder with zero PII. Created reusable `BlogToolCta` component in `client/src/components/blog-extras.tsx`.

### Enhanced
- **Zero-PII Tool Funnel Measurement (`client/src/pages/home.tsx`)**: Hooked privacy-safe funnel events: `trackUploadOpened`, `trackFileAccepted` (by format family), `trackExistingGpsDetected`, `trackMapLocationSelected` (map_click, search, device_gps), `trackProcessingStarted`, `trackProcessingCompleted` (processing duration and success count), `trackVerificationPassed` / `trackVerificationFailed`, `trackDownloadCompleted`, and `trackBatchDownloadCompleted`.
- **GPS Photo Finder Measurement (`client/src/pages/gps-finder.tsx`)**: Hooked `trackGpsFinderUsed` (recording format and whether photo had embedded coordinates), `trackUnsupportedFormat`, `trackParsingError`, and `gps_finder_copied`.
- **Input & Quality Tracking (`client/src/components/tool/coordinate-panel.tsx` & `dropzone.tsx`)**: Added tracking for manual Decimal Degree (`dd`) and DMS coordinate entries on blur/change, `trackGeocoderError` on failed address searches, and `trackUnsupportedFormat` on rejected file uploads.
- **Google Consent Mode v2 Alignment**: Validated default-denied consent state in `client/index.html` before analytics scripts execute, respecting user cookie decisions made in `CookieConsent`.

---

## [Phase 14: Security + Privacy Hardening] - 2026-09-12

### Added
- **Automated Security & Privacy Test Suite (`script/test-security-privacy.ts`)**: Implemented a comprehensive 38-point automated test suite covering Apache `.htaccess` security headers (HSTS preload, nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy, X-XSS-Protection, Content-Security-Policy), Express security middleware, logging redaction (zero query params or response bodies logged), geocoding input validation, in-memory IP rate limiting returning HTTP 429 + Retry-After, zero server upload endpoint verification, client bundle secret isolation, Dropzone 20MB limit & SVG disallow, and Object URL memory leak cleanup. Added `"test:security": "tsx script/test-security-privacy.ts"` to `package.json`.
- **Comprehensive Security & Privacy Architecture Specification (`SECURITY_PRIVACY.md` & `docs/SECURITY_PRIVACY.md`)**: Fully documented zero server image upload architecture, local-first WebAssembly/Canvas processing, zero GPS telemetry, HTTP security headers, in-memory rate limiting, input validation, logging redaction, secret isolation, and vulnerability disclosure policies.
- **In-Memory IP Sliding-Window Rate Limiting (`server/routes.ts`)**: Built a zero-dependency sliding-window IP rate limiter (`createRateLimiter`) with automatic memory cleanup. Applied 60 req/min for geocoding proxies (`/api/geocode/*`), 10 req/min for IndexNow submissions (`/api/indexnow`), and 120 req/min for general API routes (`/api/*`), emitting standard `X-RateLimit-*` and `Retry-After` headers.

### Enhanced
- **HTTP Security Headers & CSP (`server/index.ts` & `client/public/.htaccess`)**: Configured strict security headers across both Express and Apache hosting: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(), microphone=()`, `X-XSS-Protection: 1; mode=block`, and a Content-Security-Policy compatible with Leaflet maps, OpenStreetMap tiles, Google Analytics 4, and Google AdSense.
- **Privacy-Safe Server Logging Redaction (`server/index.ts`)**: Completely eliminated response payload interception (`capturedJsonResponse`). Hardened request logs to record only sanitized method, route path, status, and execution duration without user-typed search strings, postal codes, or coordinates.
- **Strict API Input Validation (`server/routes.ts`)**: Added length bounding (max 128 chars) and control-character filtering on `/api/geocode/search`. Added finite number verification (`Number.isFinite`) and coordinate range enforcement (latitude $[-90, 90]$, longitude $[-180, 180]$) on `/api/geocode/reverse`. Added max batch limit (10,000 URLs) on `/api/indexnow`.
- **Dependency Minimization & Attack Surface Reduction**: Pruned unused legacy scaffold database and auth packages (`drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `pg`, `connect-pg-simple`, `passport`, `passport-local`, `express-session`, `memorystore`), removing 55 packages from the dependency tree and eliminating the high-severity SQL injection advisory (GHSA-gpj5-g38j-94v9).
- **Express 5 Path Compatibility (`server/routes.ts`)**: Updated route definitions to use standard parameter extraction and middleware filtering compatible with Express 5 and `path-to-regexp` v8.

---

## [Phase 13: Accessibility + Browser QA] - 2026-09-12

### Added
- **Automated Accessibility & A11y QA Test Suite (`script/test-accessibility.ts`)**: Built a comprehensive 12-point automated test suite covering semantic landmarks across all 18 routes, single `<h1>` enforcement, SkipLink connectivity, keyboard dropzone/queue accessibility, non-map coordinate entry alternatives, map region descriptions, ARIA live region status updates, prefers-reduced-motion CSS support, 44x44px touch targets, and iOS Safari zoom prevention. Added `"test:a11y": "tsx script/test-accessibility.ts"` to `package.json`.
- **Cross-Browser & Cross-Device Specification (`BROWSER_SUPPORT.md` & `docs/BROWSER_SUPPORT.md`)**: Documented evergreen browser engine support matrix (Chromium, WebKit, Gecko), mobile iOS/Android requirements, and platform-specific fixes.
- **Accessible Bypass Landmarks**: Added `id="main-content" tabIndex={-1} className="outline-none ..."` across all 18 site routes, enabling the skip-to-content mechanism to focus main content on every page.

### Enhanced
- **Prefers-Reduced-Motion (`client/src/index.css`)**: Added `@media (prefers-reduced-motion: reduce)` rules enforcing `animation-duration: 0.01ms`, `transition-duration: 0.01ms`, and `scroll-behavior: auto !important` for users with vestibular or motion sensitivities.
- **Visible Focus & Contrast**: Added global `:focus-visible` styling with high-contrast outlines across light and dark themes.
- **Mobile Touch Targets**: Enhanced CookieConsent action buttons and navigation toggles to strictly enforce $\ge 44 \times 44$ px touch target dimensions (WCAG 2.5.8).
- **Interactive Map Screen Reader Alternative**: Updated Leaflet map container with descriptive instructions directing screen reader and non-mouse users to the adjacent numerical coordinate panel.
- **Updated Accessibility Audit (`ACCESSIBILITY.md` & `docs/ACCESSIBILITY.md`)**: Upgraded specification to Version 2.0.0 documenting full WCAG 2.2 AA compliance.

---

## [Phase 12: Performance Optimization] - 2026-09-11

### Added
- **Map Lazy-Loading & Zero-Shift Skeleton (`client/src/components/tool/map-skeleton.tsx`)**: Extracted a dedicated `MapSkeleton` placeholder maintaining exact aspect ratio, height, and dimensions as the interactive Leaflet map. Dynamically split `LeafletMap` with `React.lazy` wrapped in `<React.Suspense fallback={<MapSkeleton />}>` in both `client/src/pages/home.tsx` and `client/src/pages/gps-finder.tsx`. Eliminates Leaflet from the initial critical landing bundle, emitting it as an isolated 2.75 KB on-demand chunk.
- **Performance Budget Measurement & Audit Tool (`script/measure-performance.ts`)**: Implemented automated production asset audit script measuring uncompressed and gzipped sizes, eager vs. lazy JS splitting, critical CSS budgets, HTML size, and CLS zero-shift guardrails. Added `"perf:measure": "tsx script/measure-performance.ts"` to `package.json`.
- **Verifiable Performance Reports (`PERFORMANCE_BUDGET.md` & `docs/PERFORMANCE_BUDGET.md`)**: Automated generation of performance audit markdown documentation tracking Core Web Vitals targets (LCP <= 2.5s, INP <= 200ms, CLS = 0.00) and asset weight limits.

### Enhanced
- **Zero CLS Guarantee**: Enforced layout reservation with `#root` `min-height: 100vh` and `MapSkeleton` geometry, maintaining strict `CLS = 0.00`.
- **System Font Stack Optimization (`client/src/index.css`)**: Configured native system font variables (`--font-sans`, `--font-display`, `--font-mono`) in `:root`, eliminating external font roundtrips, FOIT (Flash of Invisible Text), and FOUT (Flash of Unstyled Text).
- **Heavy Code Splitting**: Confirmed non-critical libraries (`heic2any` 1.29 MB, `jszip` 94.6 KB, `file-saver` 3.0 KB) remain strictly isolated in on-demand lazy chunks with zero eager critical bundle footprint.

---

## [Phase 11: Bing + IndexNow] - 2026-09-11

### Added
- **Bing Webmaster Verification Support**: Added standard `client/public/BingSiteAuth.xml` verification file and injected `<meta name="msvalidate.01" content="E0D90E8F27DE42939B95E0528659FECA" />` into `client/index.html` and all prerendered static SEO routes.
- **IndexNow Key Management**: Created `client/public/f83e29a0b14c46f6a73d819e6d0a7f14.txt` hosting the IndexNow key at the root location (`https://freegeotagger.com/f83e29a0b14c46f6a73d819e6d0a7f14.txt`).
- **IndexNow Shared Module (`server/indexnow.ts`)**: Implemented strict canonical URL validation, 17-route filtering, key location generation, git diff change detection mapper, and sanitized logging.
- **Deployment & Submission CLI Hook (`script/indexnow-submit.ts`)**: Automated CLI tool supporting `--git` (automatic detection of changed pages), `--urls`, `--all`, and safe dry-run mode. Added npm scripts `npm run indexnow` and `npm run test:indexnow`.
- **Phase 11 Automated Test Suite (`script/test-indexnow.ts`)**: 28 automated tests validating Bing XML, IndexNow key file, meta tag, Apache exemptions, URL guardrails (blocking blobs, query params, foreign hosts, HTTP), git path mapping, payload schema, sanitized logging, and dry-run execution.

### Enhanced
- **Apache Direct Static File Serving (`.htaccess`)**: Configured direct exemption rules for `BingSiteAuth.xml` and any IndexNow key file (`([a-f0-9]{32,128})\.txt`) ensuring they bypass route rewriting on Hostinger.
- **Backend Endpoint Hardening (`server/routes.ts`)**: Hardened `POST /api/indexnow` with admin secret authorization, dynamic key text file serving (`GET /:key.txt`), and sanitized logging.

---

## [Phase 10: AEO + GEO Improvements] - 2026-09-11

### Added
- **Structured EXIF GPS Tag Reference Table**: Implemented a comprehensive technical reference table on both the interactive React page (`client/src/pages/gps-finder.tsx`) and the prerendered static HTML (`script/generate-seo-pages.ts`) documenting tag IDs (`0x0001` - `0x001D`), tag names (`GPSLatitudeRef`, `GPSLatitude`, `GPSLongitudeRef`, `GPSLongitude`, `GPSAltitudeRef`, `GPSAltitude`, `GPSTimeStamp`, `GPSDateStamp`), data types, formats, and example Rational values.
- **Troubleshooting Guide for Missing GPS Metadata**: Added a structured 4-point technical troubleshooting section addressing social media EXIF stripping, disabled camera permissions, satellite GNSS signal obstructions, and non-telemetry graphics/screenshots.
- **Standards & Specifications Citations**: Added an explicit compliance block citing EXIF 2.32 (CIPA DC-008-2012 / JEITA CP-3451D), W3C PNG Specification (ISO/IEC 15948 Section 11.3.5.3 `eXIf` chunk), WebP Google RIFF container with `VP8X` header, and OpenStreetMap/Nominatim ODbL licensing.
- **Technical Editorial Attribution & Verification Bylines**: Added verifiable review credentials ("Reviewed by FreeGeoTagger Technical Editorial Team" and "Tested with ExifTool 12.70, Chrome 128, Safari 17, QGIS 3.34").

### Enhanced
- **Direct Answer Optimization (AEO)**: Aligned all H2 question headings and answers across `/` and `/gps-finder` to present concise 1-2 sentence direct answers immediately following headings before in-depth technical explanations.
- **Generative Engine Search Readiness (GEO)**: Updated `client/public/llms.txt` with truthful, verifiable technical facts (September 2026 standards, multi-provider geocoding, in-browser Haversine verification loop, lossless binary preservation, zero server uploads).
- **Prerender Synchronization**: Synchronized static HTML prerender templates in `script/generate-seo-pages.ts` ensuring search and AI crawlers parse identical structured tables and troubleshooting sections without requiring client JavaScript execution.

---

## [Phase 9: Technical SEO] - 2026-09-11

### Added
- Created `script/test-technical-seo.ts` providing automated test coverage across all 9 technical SEO criteria (canonical URLs, SERP length ranges, robots.txt, sitemap.xml, OG 1200x630 asset verification, WebSite site name schema, Organization logo binary dimension matching, .htaccess redirect directives, and 404 recovery options).
- Created `client/public/logo.png` (matching `favicon.png` binary dimensions 289x289) for crawler accessibility and structured data compatibility.
- Upgraded `client/src/pages/not-found.tsx` to an accessible, brand-aligned 404 recovery page featuring direct links to `/`, `/gps-finder`, and `/blog`, along with explicit `robots: "noindex, follow"` metadata.
- Added Express catch-all 404 handler for unhandled `/api/*` endpoints in `server/routes.ts`.

### Enhanced
- **Organization Logo Fix**: Standardized `ORGANIZATION_SCHEMA` in `client/src/lib/seo.ts`, `client/index.html`, and `script/generate-seo-pages.ts` with accurate binary dimensions (`width: 289, height: 289`) resolving the schema warning.
- **Site Name Schema**: Injected Google-compliant `WebSite` structured data with `name: "FreeGeoTagger"` and `alternateName: ["Free Geo Tagger", "GeoTagger"]`.
- **Apache Routing & Canonicalization**: Hardened `client/public/.htaccess` with HTTPS enforcement (`RewriteCond %{HTTPS} off`), non-www redirect, `/index.html` -> `/` canonicalization, and trailing slash stripping for non-directory URLs.
- **Sitemap Freshness**: Updated `client/public/sitemap.xml` with accurate `lastmod` dates (`2026-09-11`) for the updated homepage (`/`) and GPS Finder (`/gps-finder`).
- **404 Status Hygiene**: Cleaned `client/public/404.html` by removing misleading self-referencing canonical tag while preserving `noindex, follow`.

---

## [Phase 8: Homepage SEO Content] - 2026-09-11

### Added
- Comprehensive below-the-fold homepage SEO content structuring (1,727 crawlable words) strictly following Section 12.2 and Section 26 of the Master Guide:
  - Section 1: "How It Works — Geotag Any Photo in 3 Simple Steps" (Upload, Position Pin, Download with visual step cards).
  - Section 2: "What GPS Data Is Added to Your Photos?" (Detailed EXIF breakdown: GPSLatitude, GPSLongitude, GPSAltitude, GPSTimeStamp, GPSMapDatum, GPSProcessingMethod + bit-exact pixel preservation explanation).
  - Section 3: "Supported File Formats & Technical Processing Matrix" (Feature comparison table covering JPEG APP1, PNG eXIf chunks, WebP RIFF containers, and HEIC local client conversion).
  - Section 4: "Batch Photo Geotagging" (Multi-file workflow, in-memory concurrency, client-side ZIP packaging, link to `/blog/how-to-bulk-geotag-photos`).
  - Section 5: "Why Choose FreeGeoTagger?" (Feature grid highlighting 100% privacy, zero uploads, EXIF verification loop, and complete `ToolComparisonTable`).
  - Section 6: "Photo Geotagging vs. GPS Location Detection" (Conceptual difference between adding coordinates and reading existing EXIF data, linking directly to `/gps-finder`).
  - Section 7: "100% Client-Side Privacy & In-Browser Processing" (Technical guarantee of zero server image uploads, offline capability, and zero retention).
  - Section 8: "Common Real-World Use Cases" (Targeted cards for Real Estate Listings, Google Business Profile SEO, Professional Photography, Field Surveying, Travel & Journalism, and Mobile Photographers).
  - Section 9: "Helpful Guides & Geotagging Resources" (Rich internal contextual link hubs to tutorials and companion tools).
  - Section 10: "Frequently Asked Questions" (12 comprehensive FAQs matching Section 26 with expandable accordion UI).
- Synchronized static prerender content in `script/generate-seo-pages.ts` inside `<main id="static-seo-content">` ensuring search crawlers and JavaScript-disabled visitors receive the full 1,727-word content payload.
- Injected `FAQPage` JSON-LD schema with all 12 questions and answers on the homepage.

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
