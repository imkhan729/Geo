# Changelog

All notable changes to FreeGeoTagger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
