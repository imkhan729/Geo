# Changelog

All notable changes to FreeGeoTagger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
