# Hostinger Production Deployment Guide (Phase 20)

This guide documents the complete, step-by-step procedure to deploy the latest production build of FreeGeoTagger to Hostinger Web Hosting (`public_html`).

---

## 1. Deployment Package Overview

The deployment artifact has been compiled, prerendered, and packaged:
- **Archive Location:** `freegeotagger-hostinger-static.zip` (in repository root)
- **Archive Size:** ~1.79 MB (compressed)
- **File Count:** 90 files
- **Package Integrity:** Forward-slash Linux path normalization, dotfiles included (`.htaccess`).

### Contents of `freegeotagger-hostinger-static.zip`:
1. `.htaccess` — Apache rewrite engine enforcing HTTPS, non-www, trailing slash stripping, security headers (HSTS, nosniff, SAMEORIGIN), and rewrites for all 20 static SEO routes.
2. `index.html` — Homepage with pre-injected crawlable SEO fallback content, schema markup, and Google Consent Mode v2.
3. `seo-routes/*.html` — 20 fully prerendered static SEO subpages (all $\ge$ 800 words, 0 thin content).
4. `assets/` — Minified, code-split production JavaScript chunks and Critical CSS.
5. `robots.txt` & `sitemap.xml` — Canonical sitemap covering all 21 routes.
6. `ads.txt` — Authorized Digital Sellers declaration (`pub-6438644207209483`).
7. `BingSiteAuth.xml` & `f83e...7f14.txt` — Bing Webmaster Tools & IndexNow search engine verification keys.
8. `og-image.png` & `favicon.png` — High-resolution 1200x630 social sharing card and brand icons.
9. `screenshots/` & `diagrams/` — High-DPI educational diagrams and visual guides.

---

## 2. Step-by-Step Upload Instructions (Hostinger hPanel)

Follow these exact steps to update your live website:

### Step 1: Log in to Hostinger hPanel
1. Open your browser and navigate to [https://hpanel.hostinger.com/](https://hpanel.hostinger.com/).
2. Log in to your Hostinger account.
3. Select your website (`freegeotagger.com`) and click **Manage**.

### Step 2: Open File Manager
1. In the left navigation menu or dashboard, find **Files** > **File Manager** (or click **File Manager** directly).
2. Choose **Access files of freegeotagger.com**.
3. Double-click to navigate into the **`public_html`** folder.

### Step 3: Upload the Zip Archive
1. In the top toolbar of the File Manager, click the **Upload** icon (arrow pointing up) and select **File**.
2. Browse to your local project directory:
   `c:\Users\Roy\Desktop\Uploaded Website to Hostinger\Free GEO Tagger\Freegeo Tagger Antigravity Sep 2026\freegeotagger-hostinger-static.zip`
3. Click **Open** to upload the zip file. The upload will complete in just a few seconds.

### Step 4: Extract the Files into `public_html`
1. Right-click `freegeotagger-hostinger-static.zip` in the File Manager and select **Extract** (or click the Extract icon in the toolbar).
2. In the extraction destination dialog:
   - Ensure the path is set to `/public_html` (or `.`).
   - Check **Replace existing files** (or overwrite).
   - Click **Extract**.
3. Once extracted, verify that the files (`.htaccess`, `index.html`, `seo-routes/`, `assets/`, `sitemap.xml`, etc.) are in the root of `public_html` (not nested inside a subfolder).
4. Delete `freegeotagger-hostinger-static.zip` from `public_html` to save server space.

### Step 5: Purge Server & CDN Cache
1. In hPanel, go to **Performance** > **Cache Manager**.
2. Click **Purge All** to clear Hostinger's LiteSpeed / Nginx edge cache.
3. If using Cloudflare, log in to Cloudflare and click **Purge Everything**.

---

## 3. Post-Deployment Verification

Once uploaded, run the automated live health check script in your local terminal:

```bash
npm run test:live
```

This verifies:
- `https://freegeotagger.com/` returns **200 OK**.
- All 4 new tools (`/exif-viewer`, `/remove-gps-from-photo`, `/coordinate-converter`, `/batch-geotag-photos`) return **200 OK**.
- Bing verification (`BingSiteAuth.xml`) and IndexNow key (`f83e29a0b14c46f6a73d819e6d0a7f14.txt`) return **200 OK**.
- `sitemap.xml`, `robots.txt`, and `ads.txt` return **200 OK**.

---

## 4. Search Engine Indexing (IndexNow Live Submission)

After verifying live 200 OK status, notify Bing and search engines to immediately crawl the newly added tools and expanded content:

```bash
npx tsx script/indexnow-submit.ts --all --live
```

This submits all 21 canonical URLs directly to the IndexNow API (`api.indexnow.org`) using your verified key.

---

## 5. Ongoing Monitoring Baselines

1. **Google Search Console**:
   - Inspect canonical URLs to ensure Google chooses the user-declared canonical.
   - Monitor the "Page indexing" report for 21 valid indexed pages.
   - Verify that Core Web Vitals (LCP, INP, CLS) report "Good" in the mobile and desktop reports.
2. **Bing Webmaster Tools**:
   - Verify IndexNow submission history under "IndexNow".
   - Monitor crawl errors (should remain at 0).
3. **Google AdSense**:
   - Once traffic thresholds are reached, toggle `enabled: true` in `client/src/lib/ads-config.ts` to activate monetization across the pre-allocated, CLS-guarded slots.
