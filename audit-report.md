# freegeotagger.com — Technical & Content Audit (Step 0)

**Date:** 2026-07-26
**Auditor:** Claude Code
**Status:** Audit only. **No content or SEO changes have been made.** Awaiting your review before Step 1/2.

---

## Method & evidence quality

| What | How it was measured | Confidence |
|---|---|---|
| Page inventory, word counts, headings, links | Parsed the deployed HTML in `freegeotagger-hostinger-static/` (the exact artifact uploaded to Hostinger) | **Verified** |
| Duplicate/near-duplicate content | 5-gram Jaccard shingle comparison across all 17 pages | **Verified** |
| Status codes, redirects, hostnames, compression | `curl` against the **live** site | **Verified** |
| LCP / CLS / INP / long tasks | Real Chrome, `PerformanceObserver`, live site, mobile viewport (425×568) | **Verified (lab, single location)** |
| TTFB / TLS timing | `curl`, 7 runs, **calibrated against google.com / cloudflare.com / example.com from the same machine** | **Verified** |
| Field (CrUX) Core Web Vitals | PageSpeed Insights API — **quota exhausted, could not retrieve** | **NOT AVAILABLE** |
| Keyword volume / difficulty | Not attempted in this step | **Deferred to Step 2** |

Two honest caveats:

1. **No CrUX field data.** I could not retrieve real-user Core Web Vitals — Google's keyless PSI quota was exhausted. Everything below is lab data from one location. You must confirm in GSC → Core Web Vitals. Listed in `next-steps.md` when I write it.
2. **Word counts are of *crawlable prerendered* text**, not React-rendered text. For the 9 articles these are identical (the prerenderer extracts the real `<article>`). For the 5 trust pages they differ — noted explicitly in §3.

---

## Verdict

The site is **not spam and not keyword-stuffed filler**. Content originality tested clean (§4). The AdSense rejection is almost certainly driven by **volume and depth**, not quality:

> A tool with 9 articles, 5 near-empty trust pages, zero images anywhere, and no author/date signals reads to a reviewer as "a utility with a blog bolted on," which is what the "low value content" label describes.

**Three blockers, in order of impact:**

1. **Article count: 9 of the 20–25 needed.** Single biggest gap.
2. **All 5 trust pages are 94–169 crawlable words.** A reviewer opens Privacy and Contact first. A 160-word privacy policy on a site that processes user photos is a direct credibility failure.
3. **Zero images or screenshots across the entire site.** Nine how-to articles about a visual tool with no visual proof.

None of these require deleting anything. **No page deletion is recommended** — everything thin is worth expanding instead.

---

## 1. Page inventory

17 indexable pages. All return 200, all canonical-correct, all prerendered, all in the sitemap, all reachable from the footer. Zero orphans in the strict sense; six are *under-linked*.

| URL | Crawlable words | H1 | H2 | Links in | Links out | Canonical | Prerendered |
|---|---|---|---|---|---|---|---|
| `/` | 884 | 1 | 8 | 15 | 7 | ok | yes |
| `/gps-finder` | 487 | 1 | 4 | 15 | 2 | ok | yes |
| `/blog` | 406 | 1 | 1 | 16 | 9 | ok | yes |
| `/blog/best-free-photo-geotagging-tools` | 1331 | 1 | 10 | 2 ⚠ | 5 | ok | yes |
| `/blog/how-to-geotag-photos-for-google-business-profile` | 1228 | 1 | 8 | 3 | 3 | ok | yes |
| `/blog/how-to-geotag-photos-android` | 1162 | 1 | 8 | 3 | 4 | ok | yes |
| `/blog/how-to-remove-gps-data-from-photos` | 1146 | 1 | 9 | 2 ⚠ | 6 | ok | yes |
| `/blog/what-is-exif-gps-metadata` | 1046 | 1 | 9 | 5 | 3 | ok | yes |
| `/blog/how-to-fix-wrong-gps-location-on-photos` | 943 | 1 | 7 | 1 ⚠ | 5 | ok | yes |
| `/blog/how-to-add-gps-to-iphone-photos` | 932 | 1 | 7 | 3 | 3 | ok | yes |
| `/blog/how-to-bulk-geotag-photos` | 921 | 1 | 6 | 1 ⚠ | 7 | ok | yes |
| `/blog/how-to-geotag-photos-for-real-estate` | 862 | 1 | 7 | 4 | 3 | ok | yes |
| `/about` | 169 | 1 | 0 | 2 ⚠ | 5 | ok | yes |
| `/privacy` | 160 | 1 | 0 | 5 | 5 | ok | yes |
| `/terms` | 134 | 1 | 0 | 2 ⚠ | 5 | ok | yes |
| `/cookies` | 122 | 1 | 0 | 2 ⚠ | 5 | ok | yes |
| `/contact` | 94 | 1 | 0 | 1 ⚠ | 5 | ok | yes |

**Totals:** 17 indexable · 12 under 800 words · 5 under 400 words · 0 duplicate titles · 0 duplicate descriptions · 0 broken internal links · 0 orphans · 6 pages with fewer than 3 inbound links.

---

## 2. AdSense "low value content" — policy-by-policy

| Requirement | Status | Evidence |
|---|---|---|
| 20–25 substantial articles | ❌ **9 articles**, avg 1,063 words | §1 |
| Articles 1,200–2,000 words | ⚠ **2 of 9** clear 1,200 (1,331 / 1,228); 7 are 862–1,162 | §1 |
| About page | ⚠ exists, **169 words** | §3 |
| Contact page | ⚠ exists, **94 words**, email only, **no form** | §3 |
| Privacy Policy | ⚠ exists, **160 words** | §3 |
| — mentions cookies | ✅ yes | source review |
| — mentions EXIF handling | ✅ yes | source review |
| — states photos aren't uploaded | ✅ yes, clearly | source review |
| Terms of Service | ⚠ exists, **134 words** | §3 |
| Cookie Policy | ⚠ exists, **122 words** | §3 |
| All trust pages in footer | ✅ **yes** — all 7 links present | `Footer.tsx` |
| Homepage explains what/how/who/data | ✅ **yes**, 884 words incl. "What Is Geotagging", "Why Choose", "Privacy-First by Design", "Who Uses" | §1 |
| Original value: comparison tables | ✅ homepage has a 7-row comparison table | prerendered HTML |
| Original value: FAQs | ⚠ **homepage (9) + gps-finder (6) only. 0 of 9 articles have a FAQ block** | §6 |
| Original value: **screenshots** | ❌ **zero `<img>` in all 9 articles; zero on any page except the logo** | verified by grep |
| Step-by-step walkthroughs | ✅ present as text in how-to articles | source review |
| No AI-generic repetition across articles | ✅ **passes** — see §4 | shingle analysis |
| Functional navigation | ✅ header + footer + breadcrumbs + blog hub | verified |
| Pages <400 words with no unique value | ⚠ 5 trust pages — **expand, do not delete** | §3 |

**Net:** 7 hard gaps. The two that a human reviewer will notice within 30 seconds are the **94-word Contact page** and the **total absence of images**.

---

## 3. Thin pages — detail

The 5 trust pages are thin in the prerendered HTML *and* in React. The prerenderer uses a plain-paragraph fallback for these (they have no `<article>` to extract), so crawlers see even less than users do:

| Page | Crawlable (prerendered) | React-rendered | Gap |
|---|---|---|---|
| `/about` | 169 | ~279 | −110 |
| `/privacy` | 160 | ~324 | −164 |
| `/terms` | 134 | ~290 | −156 |
| `/cookies` | 122 | ~272 | −150 |
| `/contact` | 94 | ~200 | −106 |

Both numbers are too low. A privacy policy covering browser-local EXIF processing, cookies, Consent Mode, AdSense/third-party ad cookies, OpenStreetMap and Nominatim third-party calls, GDPR and CCPA rights, and data retention should be 800–1,200 words. Yours is 160.

`/blog` (406 words) and `/gps-finder` (487 words) are also thin. `/gps-finder` is a **tool page ranking for real queries** — it deserves the same depth treatment as the homepage.

**Recommendation: expand all 7. Delete nothing.** I will not remove any page without asking you first, per your constraint.

---

## 4. Duplicate & near-duplicate content — PASSES

Full pairwise 5-gram shingle comparison across all 17 pages. Only one pair exceeded a 6% Jaccard threshold:

```
8.5% jaccard (18.2% of the smaller page) — /cookies <-> /privacy
```

That is normal, expected legal-page overlap and is **not** a problem. Every article pair scored below the threshold.

Repeated sentences across 3+ pages: **one**, and it is the shared navigation list — boilerplate, not content.

**Conclusion: the existing 9 articles are genuinely distinct.** Whatever triggered the AdSense rejection, it was not spun or duplicated text. Do not rewrite these articles; add to them and add more of them.

---

## 5. Technical & indexing

### Working correctly — do not change
- `robots.txt` — clean, no accidental blocks, sitemap referenced.
- `sitemap.xml` — **17 URLs, exactly matching the 17 indexable pages. Zero missing, zero extra, zero non-canonical.**
- Canonicals — correct and self-referential on all 17.
- No `noindex` anywhere.
- 404s return a real **404 status** (not soft-404). `ErrorDocument` configured.
- `http://` → `https://` redirects in **one hop**. No chains.
- Brotli compression active; HTTP/2 confirmed via browser (`nextHopProtocol: h2`).
- **Prerendering works.** Every route serves real HTML content to crawlers — the old "empty `<div id="root">`" problem is fixed and stayed fixed.

### Issues found

**5.1 — `www` and non-`www` both serve 200 with no redirect** *(medium)*
```
https://freegeotagger.com/      → 200
https://www.freegeotagger.com/  → 200   ← should 301 to non-www
```
Both serve byte-identical content. The canonical tag on the www version correctly points to non-www, which mitigates the duplication, but you're splitting crawl budget and any links pointing at www. Fix with a 301 in `.htaccess`.

**5.2 — `og-image.png` returns 404 sitewide** *(high, easy)*
All **17 pages** reference `https://freegeotagger.com/og-image.png`. It does not exist:
```
https://freegeotagger.com/og-image.png → 404
```
Consequences: every social/WhatsApp/Slack share of your site shows a broken preview, and the homepage `SoftwareApplication` schema's `screenshot` property points at a 404, which weakens that structured data. The file is also absent from the deploy folder — it has never been uploaded.

**5.3 — Six pages have fewer than 3 inbound internal links** *(medium)*
`/blog/how-to-bulk-geotag-photos` (1), `/blog/how-to-fix-wrong-gps-location-on-photos` (1), `/contact` (1), `/blog/best-free-photo-geotagging-tools` (2), `/blog/how-to-remove-gps-data-from-photos` (2), `/about` `/terms` `/cookies` (2 each).

Notably the **three newest articles are the most under-linked** — they were added to the blog index and sitemap but never cross-linked from older articles. Your spoke-to-spoke linking is weak; almost all internal links flow hub→spoke, not spoke→spoke.

**5.4 — No HSTS header** *(low)*
`Strict-Transport-Security` is absent. Minor hardening, not an SEO blocker.

---

## 6. Structured data & rich results

| Page type | Present | Missing / broken |
|---|---|---|
| Homepage | SoftwareApplication, WebPage, Organization, HowTo, WebSite, FAQPage | `screenshot` → 404 (§5.2) |
| `/gps-finder` | WebPage, BreadcrumbList, FAQPage | **No SoftwareApplication/WebApplication** despite being a tool page |
| 9 articles | Article, BreadcrumbList | **`author`, `datePublished`, `dateModified`, `image`, `publisher` — all absent** |
| `/blog` | WebPage, BreadcrumbList | fine |
| 5 trust pages | Article, BreadcrumbList | typed `Article` — should be `WebPage` |

**6.1 — Article schema is incomplete and will fail the Rich Results Test.** Current shape:
```
Article keys: @context, @type, name, headline, url, description, inLanguage, isPartOf
```
Google requires `author` and `datePublished` for Article rich results; `image` and `publisher` are strongly recommended. All are missing on all 9 articles.

**6.2 — Author and date exist in React but do not prerender.** The sources carry `Published: "2026-03-25"` and `By FreeGeoTagger`, but that byline sits outside the `<article>` element the prerenderer extracts, so **crawlers see no author and no date on any article**. This is a direct E-E-A-T signal loss and it compounds 6.1.

**6.3 — No FAQPage schema on any article.** 0 of 9. Five articles already have H3 question blocks that would qualify; four have no FAQ section at all.

**6.4 — OG/Twitter tags present on all 17 pages** ✅ — but every one points at the 404 image.

---

## 7. Core Web Vitals

Measured in real Chrome against the live site, mobile viewport.

| Metric | Measured | Target | Verdict |
|---|---|---|---|
| **LCP** | **8,540 ms** | < 2,500 ms | ❌ **FAIL** |
| **CLS** | **0.000** | < 0.1 | ✅ **PASS** (perfect) |
| **INP** (worst of 8 real interactions) | **192 ms** | < 200 ms | ⚠ **borderline pass** |
| FCP | 8,540 ms | — | fails with LCP |
| TTFB | 6,670 ms | < 800 ms | ❌ **FAIL** |
| Long tasks | 9, totalling 1,279 ms | — | INP risk |
| Page weight | 635 KB / 18 requests | — | acceptable |

### The worst offender is TLS handshake time, and it is a hosting problem, not a code problem

The document request spent **6,338 ms in the TLS handshake alone**. Every subsequent same-origin asset reused that connection at `tls=0`.

I calibrated this against other origins **from the same machine, same session**, to rule out my own network:

```
https://www.google.com/       tls=0.51s   ttfb=0.72s
https://www.cloudflare.com/   tls=0.33s   ttfb=0.62s
https://example.com/          tls=0.58s   ttfb=0.62s
https://freegeotagger.com/    tls=6.48s   ttfb=6.63s   ← 10-20x slower
```

Seven consecutive runs on freegeotagger.com: 6.19s, 6.34s, 6.37s, 6.39s, 6.48s, 6.66s (favicon), 6.23s (www). Perfectly consistent, so not a fluke.

**Do the arithmetic:** LCP 8,540 − TTFB 6,670 = **~1,870 ms of actual client-side work**. If TTFB were a normal ~600 ms, LCP would land around **2.5 s** — right at the threshold. **Fix the server handshake and LCP largely fixes itself.** Optimising JavaScript first would be treating the symptom.

Caveat, stated plainly: this is one geographic location. It could be a regional Hostinger edge issue rather than global. **Confirm in GSC → Core Web Vitals and PageSpeed Insights before spending money on a hosting change.**

Secondary, genuinely code-side: `assets/image-tools-*.js` is **493 KB transferred** (1.48 MB raw) and loads on the homepage. That is the HEIC/EXIF library and it is the main contributor to the 1,279 ms of long tasks. Making it load on first file selection rather than on page load is the highest-value INP/TBT win.

---

## 8. Meta titles & descriptions — current compliance

**12 of 17 titles and 8 of 17 descriptions are outside Google's rendering limits.** No duplicates, which is good.

| URL | Title len | Status | Desc len | Status |
|---|---|---|---|---|
| `/` | 76 | ❌ +16 | 164 | ❌ +4 |
| `/gps-finder` | 72 | ❌ +12 | 156 | ✅ |
| `/blog` | 68 | ❌ +8 | 153 | ✅ |
| `/blog/how-to-geotag-photos-android` | 69 | ❌ +9 | 152 | ✅ |
| `/blog/how-to-add-gps-to-iphone-photos` | 68 | ❌ +8 | 154 | ✅ |
| `/blog/how-to-geotag-photos-for-real-estate` | 65 | ❌ +5 | 140 | ✅ |
| `/blog/how-to-geotag-photos-for-google-business-profile` | 64 | ❌ +4 | 152 | ✅ |
| `/blog/how-to-bulk-geotag-photos` | 62 | ❌ +2 | 164 | ❌ +4 |
| `/blog/how-to-remove-gps-data-from-photos` | 59 | ✅ | 166 | ❌ +6 |
| `/blog/what-is-exif-gps-metadata` | 57 | ✅ | 118 | ❌ −22 |
| `/blog/best-free-photo-geotagging-tools` | 56 | ✅ | 157 | ✅ |
| `/blog/how-to-fix-wrong-gps-location-on-photos` | 56 | ✅ | 163 | ❌ +3 |
| `/contact` | 53 | ✅ | 131 | ❌ −9 |
| `/about` | 48 | ❌ −2 | 146 | ✅ |
| `/terms` | 32 | ❌ −18 | 125 | ❌ −15 |
| `/privacy` | 30 | ❌ −20 | 151 | ✅ |
| `/cookies` | 29 | ❌ −21 | 125 | ❌ −15 |

The homepage title at 76 characters is truncated in SERPs — it currently cuts off around *"…to Any Photo Onl…"*, hiding the brand entirely. That is a CTR loss on your single highest-impression page.

---

## 9. Reading the GSC data against these findings

Your brand queries win; long-tail intent queries lose. That pattern is consistent with what I measured:

- **`geotagger` +95%, `geo tagger` +100%** — brand recognition is growing. The homepage ranks and converts on name recognition.
- **`free geotagging tool` −50%, `free geo tagging` −50%** — these are *commercial-investigation* queries. A searcher typing them wants a comparison or a review, not a drag-and-drop box. You have exactly one page serving that intent (`best-free-photo-geotagging-tools`) and it has **only 2 inbound internal links** — your weakest-linked long-form asset is the one defending your most-declining query.
- **`add gps location to photo online free` −1, `geotag adder` −1** — no dedicated page targets either. They currently land on the homepage, which is a tool page, so dwell time and satisfaction are poor.

**Cannibalization hypothesis to test in Step 2:** `/` and `/blog/best-free-photo-geotagging-tools` both target "free geotagging tool" phrasing. That is a plausible cause of the −50% decline and needs an explicit primary-keyword split. I have not confirmed this — it requires the GSC per-page query data that only you can export.

---

## 10. Prioritised fix list

### P0 — AdSense blockers (must all be done before reapplying)
1. Write **11–16 new articles**, 1,200–2,000 words each → reach 20–25 total.
2. Expand the **5 trust pages**: Privacy → 800–1,200 words, Terms/Cookies/About → 600–900, Contact → 400+ **with a working form**.
3. Add **screenshots to every how-to article** — real UI captures of the tool, with descriptive alt text.
4. Bring the 7 articles under 1,200 words up to depth.
5. Upload the missing **`og-image.png`**.

### P1 — Indexing & rich results
6. Add `author`, `datePublished`, `dateModified`, `image`, `publisher` to Article schema.
7. Move the byline **inside `<article>`** so it prerenders.
8. Add `FAQPage` schema + real FAQ blocks to all articles.
9. Add `SoftwareApplication` schema to `/gps-finder`; retype trust pages `Article` → `WebPage`.
10. 301 `www` → non-`www`.
11. Add 3+ contextual inbound links to each of the 6 under-linked pages; build spoke↔spoke linking.

### P2 — CTR & performance
12. Rewrite the 12 out-of-range titles and 8 descriptions (Step 3).
13. **Investigate the 6.3 s TLS handshake with Hostinger** — single highest-impact CWV fix.
14. Defer `image-tools-*.js` to first file selection (−493 KB from initial load).
15. Expand `/gps-finder` (487 → 1,000+) and `/blog` (406 → 800+).
16. Add HSTS.

---

## 11. What I need from you before Step 1

1. **Screenshots.** I cannot produce authentic UI captures of your tool at the quality a reviewer expects, and I won't fabricate mockups and present them as product screenshots. Options: you capture them, or I write a script that drives the real tool in a browser and captures genuine screenshots automatically. **Tell me which.**
2. **Contact form.** Adding a working form needs a backend or a third-party endpoint (Formspree, Web3Forms, Hostinger's PHP mail). The current deploy is fully static. **Which do you want?** If you'd rather keep it static, a prominently displayed real email plus expanded content is acceptable to AdSense, just weaker.
3. **Author identity.** For `author` schema and E-E-A-T — publish as the "FreeGeoTagger" organisation, or under a named person with a short bio? A named human is materially stronger for E-E-A-T.
4. **Confirm nothing gets deleted.** My recommendation is to expand all thin pages rather than remove any. Say so if you disagree.
5. **GSC export.** To confirm the cannibalization hypothesis in §9 I need Performance → Pages → per-page queries for `/` and `/blog/best-free-photo-geotagging-tools`.
6. **Keyword data source.** I have no paid SEO API here. For Step 2 I can (a) use a free source and cite it, or (b) mark every volume/difficulty as an unverified estimate with reasoning. Per your constraint I will **not invent numbers**. **Which do you prefer?**

---

**Next step:** your review. On approval I proceed to Step 2 (keyword plan) and Step 1 (content), delivering `keyword-plan.csv`, `content-plan.md`, `meta-tags-report.md`, and `next-steps.md`, committing one logical change per area.
