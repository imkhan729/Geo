# FreeGeoTagger — Migration & Route Inventory Map

**Document Version:** 1.0.0 (Phase 1 Audit Baseline)  
**Last Updated:** 2026-09-11  
**Scope:** File, route, dependency, and component migration tracking for upcoming phases.

---

## 1. Route Migration & Preservation Matrix

Every single existing URL must be mapped and preserved. No route may be removed, renamed, or modified without an explicit 301 redirect and justification.

| Canonical Path | Current Implementation | Prerender Source | Live Status | Target Treatment |
|---|---|---|---|---|
| `/` | `client/src/pages/home.tsx` | `dist/public/index.html` | 200 OK | **Preserve.** Refactor UI and metadata verification in Phase 3–5. |
| `/gps-finder` | `client/src/pages/gps-finder.tsx` | `seo-routes/gps-finder.html` | 200 OK | **Preserve.** Upgrade in Phase 6 (DMS toggle, copy button, verified preview). |
| `/blog` | `client/src/pages/blog/index.tsx` | `seo-routes/blog.html` | 200 OK | **Preserve.** Hub layout improvements in Phase 18. |
| `/blog/best-free-photo-geotagging-tools` | `client/src/pages/blog/best-free-photo-geotagging-tools.tsx` | `seo-routes/blog-best-free-photo-geotagging-tools.html` | 200 OK | **Preserve.** Deepen comparison table in Phase 18. |
| `/blog/how-to-add-gps-to-iphone-photos` | `client/src/pages/blog/how-to-add-gps-to-iphone-photos.tsx` | `seo-routes/blog-how-to-add-gps-to-iphone-photos.html` | 200 OK | **Preserve.** Maintain Safari instructions and screenshots. |
| `/blog/how-to-geotag-photos-android` | `client/src/pages/blog/how-to-geotag-photos-android.tsx` | `seo-routes/blog-how-to-geotag-photos-android.html` | 200 OK | **Preserve.** Maintain Chrome on Android instructions. |
| `/blog/how-to-geotag-photos-for-google-business-profile` | `client/src/pages/blog/how-to-geotag-photos-for-google-business-profile.tsx` | `seo-routes/blog-how-to-geotag-photos-for-google-business-profile.html` | 200 OK | **Preserve.** Ensure strict compliance (no false GBP ranking claims). |
| `/blog/how-to-geotag-photos-for-real-estate` | `client/src/pages/blog/how-to-geotag-photos-for-real-estate.tsx` | `seo-routes/blog-how-to-geotag-photos-for-real-estate.html` | 200 OK | **Preserve.** Focus on MLS and property listing workflows. |
| `/blog/what-is-exif-gps-metadata` | `client/src/pages/blog/what-is-exif-gps-metadata.tsx` | `seo-routes/blog-what-is-exif-gps-metadata.html` | 200 OK | **Preserve.** Technical AEO/GEO reference piece. |
| `/blog/how-to-remove-gps-data-from-photos` | `client/src/pages/blog/how-to-remove-gps-data-from-photos.tsx` | `seo-routes/blog-how-to-remove-gps-data-from-photos.html` | 200 OK | **Preserve.** Key privacy guide linking to future remove tool. |
| `/blog/how-to-fix-wrong-gps-location-on-photos` | `client/src/pages/blog/how-to-fix-wrong-gps-location-on-photos.tsx` | `seo-routes/blog-how-to-fix-wrong-gps-location-on-photos.html` | 200 OK | **Preserve.** Troubleshooting guide supporting the main tool. |
| `/blog/how-to-bulk-geotag-photos` | `client/src/pages/blog/how-to-bulk-geotag-photos.tsx` | `seo-routes/blog-how-to-bulk-geotag-photos.html` | 200 OK | **Preserve.** Bulk workflow guide linking to batch feature. |
| `/about` | `client/src/pages/about.tsx` | `seo-routes/about.html` | 200 OK | **Preserve.** Trust page with author/engineering transparency. |
| `/contact` | `client/src/pages/contact.tsx` | `seo-routes/contact.html` | 200 OK | **Preserve.** Verified contact channels and support context. |
| `/privacy` | `client/src/pages/privacy.tsx` | `seo-routes/privacy.html` | 200 OK | **Preserve.** Verifiable privacy policy matching client-side code. |
| `/terms` | `client/src/pages/terms.tsx` | `seo-routes/terms.html` | 200 OK | **Preserve.** Clear terms of service. |
| `/cookies` | `client/src/pages/cookies.tsx` | `seo-routes/cookies.html` | 200 OK | **Preserve.** Cookie consent explanation and opt-out controls. |
| `/404.html` | `client/public/404.html` + `client/src/pages/not-found.tsx` | Standalone HTML | 404 | **Preserve.** Helpful custom 404 page for Apache and SPA. |

---

## 2. Component Inventory & Action Plan

| Component Path | Status | Action in Planned Phases |
|---|---|---|
| `client/src/components/Header.tsx` | Keep / Refactor | Modernize navigation, mobile drawer, accessible aria labels (Phase 3). |
| `client/src/components/Footer.tsx` | Keep / Refactor | Complete internal linking, trust links, copyright (Phase 3). |
| `client/src/components/cookie-consent.tsx` | Keep | Integrates with Consent Mode v2 (Phase 15). |
| `client/src/components/geotag-map.tsx` | Refactor | Abstract map provider; ensure non-blocking loading (Phase 7). |
| `client/src/components/location-map.tsx` | Refactor | Consolidate duplicate map logic with `geotag-map.tsx` (Phase 7). |
| `client/src/components/multi-image-uploader.tsx` | Refactor | Enhance drag/drop, keyboard accessibility, mobile file picker (Phase 4). |
| `client/src/components/metadata-panel.tsx` | Refactor | Re-architect into clean coordinate input & verification card (Phase 4). |
| `client/src/components/metadata-form.tsx` | Consolidate | Merge form logic into unified tool panel (Phase 4). |
| `client/src/components/theme-provider.tsx` | Keep | Dark/light theme management. |
| `client/src/components/theme-toggle.tsx` | Keep | Accessible theme switch. |
| `client/src/components/ui/smokey-cursor-effect.tsx` | **Deleted** | Removed dead 676-line canvas cursor animation (Performance win). |
| Unused UI primitives (`chart.tsx`, `calendar.tsx`, `drawer.tsx`, `menubar.tsx`, etc.) | **Deprecate** | Prune safely in Phase 12/14 to reduce repository noise and bundle scan times. |

---

## 3. Dependency Inventory & Hygiene Plan

### Production Dependencies to Retain
- `react`, `react-dom` (Core runtime)
- `wouter` (Lightweight SPA routing)
- `piexifjs` (EXIF read/write)
- `heic2any` (HEIC conversion, code-split)
- `file-saver` (Client download)
- `jszip` (Batch download archive, code-split)
- `leaflet` (Map engine, lazy-loaded)
- `clsx`, `tailwind-merge`, `class-variance-authority` (Styling utilities)
- `lucide-react` (Icons)
- `@radix-ui/*` (Required accessible primitives)

### Dead / Unused Dependencies Identified for Safe Deprecation
These were inherited from initial Replit full-stack templates and are never invoked:
- `@tanstack/react-query` (No REST API queries in client)
- `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `pg`, `connect-pg-simple` (Zero database required)
- `passport`, `passport-local`, `express-session`, `memorystore` (Zero authentication required)
- `recharts` (No charts in application)
- `date-fns` (Not used in core utility)
- `input-otp`, `embla-carousel-react` (Unused UI widgets)

---

## 4. Metadata Engine Migration Plan

| Format | Current Status | Planned Phase 5 Target |
|---|---|---|
| **JPEG / JPG** | Fully working via `piexifjs` | Add binary verification (re-read after write) to guarantee embedded GPS match. |
| **PNG** | Custom `eXIf` chunk insertion | Add verification test fixture and fallback handling. |
| **WebP** | Custom RIFF `VP8X` + `EXIF` chunk insertion | Add verification test fixture and format integrity test. |
| **HEIC** | Transcoded to JPEG via `heic2any` | Document JPEG conversion explicitly to user in UI; maintain quality. |

---

## 5. Rollback & Safety Protocol

1. Every phase commits clean, isolated changes to Git.
2. If any regression occurs, `git checkout` or `git revert` provides instant recovery.
3. Build verification gates (`npm run check` and `npm run build`) must pass before any phase is marked complete.
