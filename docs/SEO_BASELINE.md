# FreeGeoTagger — SEO Baseline & Performance Record

**Baseline Date:** Settled through 2026-09-08  
**Recorded By:** Google Antigravity (Phase 1 Audit)  
**Primary Invariant:** Under no circumstance may visual or functional changes degrade existing search rankings, impressions, or CTR.

---

## 1. Google Search Console Baseline Snapshot (28-Day Window)

| Metric | Recorded Value | Evaluation |
|---|---|---|
| **Total Clicks (28d)** | **273** | Established organic traffic base |
| **Total Impressions (28d)** | **5,016** | Core keyword visibility |
| **Average CTR** | **5.44%** | Strong intent-driven click-through rate |
| **Average Position** | **17.95** | High-potential position 2–3 boundary |
| **Homepage Clicks** | **262** (96% of site clicks) | Homepage is the primary transactional asset |
| **Homepage Impressions** | **4,443** (88.6% of site impressions) | Primary ranking vehicle across major queries |

### Top Performing Core Queries (Settled Positions)

| Query Family | Target Page | Avg Position | Priority Tier | Strategy |
|---|---|---|---|---|
| `geotagger` | `/` | **4.34** | Tier 1 (Primary) | Defend Page 1 rank; optimize snippet CTR |
| `geo tagger` | `/` | **4.89** | Tier 1 (Primary) | Maintain spaced brand variant rank |
| `geotag free` | `/` | **5.21** | Tier 1 (Primary) | Move into top 3; emphasize free utility |
| `geotagger online` | `/` | **7.84** | Tier 1 (Primary) | Push from bottom of Page 1 into top 5 |
| `geotag photos online free` | `/` | Top 15 | Tier 1 | Support with fast browser-based value proposition |
| `add GPS to photo` | `/` | Top 20 | Tier 1 | Strengthen transactional action phrases |
| `find GPS location from photo` | `/gps-finder` | High impressions / Low CTR | Tier 2 | Upgrade tool and metadata to capture searcher phrasing |

---

## 2. Keyword Intent Architecture & Hierarchy

### Tier 1 — Homepage Ownership (Do Not Fragment)
The homepage (`/`) must remain the single authoritative landing page for all variations of the core geotagging transactional intent:
- `geotagger`, `free geotagger`, `geo tagger`, `geotagger online`
- `geotag free`, `free geotagging tool`, `geotag photos online free`, `free geotag photos online`
- `geo tagging tool`, `image geotagger`, `geotag image`, `geotag photo`
- `add GPS to photo`, `add location to photo`

**Rule:** Never create separate thin landing pages targeting these keyword synonyms (e.g., do NOT create `/free-geotagger` or `/geotagger-online`). Such pages cause keyword cannibalization and thin content penalties.

### Tier 2 — Dedicated Functional Intent Tools
Separate dedicated tool URLs are permitted ONLY when the functionality and user journey are distinctly different from adding GPS coordinates:
- `/gps-finder`: Extract and view existing photo coordinates on a map.
- `/exif-viewer`: Detailed breakdown of camera, lens, exposure, and orientation metadata (Planned Phase 17).
- `/remove-gps-from-photo`: Strip location metadata for privacy before sharing (Planned Phase 17).

### Tier 3 — Supporting Task-Oriented Guides
Guides must solve concrete, documented user tasks with step-by-step instructions, real examples, and genuine technical depth:
- How to geotag photos on iPhone / Android.
- How to bulk geotag photos for events, real estate, and fieldwork.
- How to correct inaccurate or drifted GPS coordinates.
- Understanding EXIF GPS rational formats and privacy implications.

---

## 3. Canonical Route Inventory & Status

All 17 current URLs return HTTP 200, are self-canonicalized, included in `/sitemap.xml`, reachable via crawlable internal links, and have SERP-validated titles and descriptions:

| Canonical URL | Page Type | Status Code | Crawlable Prerendered | Title Length | Description Length |
|---|---|---|---|---|---|
| `https://freegeotagger.com/` | Tool / Landing | 200 | Yes (`<main id="static-seo-content">`) | 52 chars | 145 chars |
| `https://freegeotagger.com/gps-finder` | Tool | 200 | Yes | 53 chars | 143 chars |
| `https://freegeotagger.com/blog` | Blog Index | 200 | Yes | 52 chars | 148 chars |
| `https://freegeotagger.com/blog/best-free-photo-geotagging-tools` | Guide | 200 | Yes | 51 chars | 148 chars |
| `https://freegeotagger.com/blog/how-to-add-gps-to-iphone-photos` | Guide | 200 | Yes | 50 chars | 151 chars |
| `https://freegeotagger.com/blog/how-to-geotag-photos-android` | Guide | 200 | Yes | 53 chars | 149 chars |
| `https://freegeotagger.com/blog/how-to-geotag-photos-for-google-business-profile` | Guide | 200 | Yes | 53 chars | 145 chars |
| `https://freegeotagger.com/blog/how-to-geotag-photos-for-real-estate` | Guide | 200 | Yes | 54 chars | 151 chars |
| `https://freegeotagger.com/blog/what-is-exif-gps-metadata` | Guide | 200 | Yes | 50 chars | 150 chars |
| `https://freegeotagger.com/blog/how-to-remove-gps-data-from-photos` | Guide | 200 | Yes | 53 chars | 148 chars |
| `https://freegeotagger.com/blog/how-to-fix-wrong-gps-location-on-photos` | Guide | 200 | Yes | 53 chars | 150 chars |
| `https://freegeotagger.com/blog/how-to-bulk-geotag-photos` | Guide | 200 | Yes | 53 chars | 148 chars |
| `https://freegeotagger.com/about` | Trust | 200 | Yes | 51 chars | 146 chars |
| `https://freegeotagger.com/contact` | Trust | 200 | Yes | 50 chars | 147 chars |
| `https://freegeotagger.com/privacy` | Trust / Legal | 200 | Yes | 51 chars | 143 chars |
| `https://freegeotagger.com/terms` | Trust / Legal | 200 | Yes | 53 chars | 142 chars |
| `https://freegeotagger.com/cookies` | Trust / Legal | 200 | Yes | 51 chars | 144 chars |

---

## 4. Technical SEO Invariants & Guardrails

1. **Title Length Constraint:** Enforce 50–60 characters to prevent Google SERP truncation on mobile and desktop displays.
2. **Meta Description Constraint:** Enforce 140–160 characters to maximize SERP snippet real estate without truncation.
3. **Build Guard:** `script/validate-meta.ts` must execute as part of every production build and fail the build if any violation or duplicate is detected.
4. **Structured Data Authenticity:**
   - No fabricated reviews, aggregate ratings, or fake user statistics.
   - `Organization` schema must supply a valid `logo` object (`https://freegeotagger.com/favicon.png`, 512x512).
   - Structured data must reflect visible on-page content.
5. **No False Google Business Profile Claims:** Never state or imply that geotagging photos directly improves Google Business Profile local search rankings. Frame metadata strictly as location clarity, verification, and MLS/Google Photos compatibility.
