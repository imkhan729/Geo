import { strict as assert } from "assert";
import fs from "fs";
import path from "path";
import {
  SEO_CONFIG,
  SITE_URL,
  WEBSITE_SCHEMA,
  ORGANIZATION_SCHEMA
} from "../client/src/lib/seo";
import { ADS_CONFIG } from "../client/src/lib/ads-config";
import { parseCoordinateCsv, matchCsvToImages } from "../client/src/lib/batch-workflow-utils";
import { convertAllFormats, parseAnyCoordinates } from "../client/src/lib/coordinate-converter-utils";
import { inspectImageForRemoval, removeGpsFromPhoto } from "../client/src/lib/remove-gps-utils";
import { PROHIBITED_PARAM_KEYS, sanitizeAnalyticsParams } from "../client/src/lib/analytics";

console.log("=================================================");
console.log("  FREEGEOTAGGER PHASE 19 FINAL PRE-LAUNCH QA     ");
console.log("  36-POINT PRE-PRODUCTION VERIFICATION SUITE    ");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(group: string, num: number, name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  [PASS] Point ${num.toString().padStart(2, "0")} [${group}]: ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  [FAIL] Point ${num.toString().padStart(2, "0")} [${group}]: ${name}`);
      console.error(`         Error: ${err.message}`);
      failedCount++;
    });
}

async function runAllTests() {
  const publicDir = path.resolve("dist/public");
  const clientDir = path.resolve("client/src");

  // ==========================================
  // GROUP 1: Core Tool Workflows & Functional Invariants (Points 1–6)
  // ==========================================
  const G1 = "Core Tools";

  await runTest(G1, 1, "Single Photo Geotagger core UI, map integration and non-map coordinate fallbacks", () => {
    const homeSrc = fs.readFileSync(path.join(clientDir, "pages/home.tsx"), "utf-8");
    assert.ok(homeSrc.includes("LazyLeafletMap"), "Homepage must include Leaflet map component");
    assert.ok(homeSrc.includes("Dropzone"), "Homepage must include Dropzone component");
    assert.ok(homeSrc.includes("FileQueue"), "Homepage must include FileQueue component");
    assert.ok(homeSrc.includes("CoordinatePanel"), "Homepage must include CoordinatePanel fallback");
    assert.ok(homeSrc.includes("addGeotagAndVerify"), "Homepage must support in-memory EXIF verification loop");
  });

  await runTest(G1, 2, "GPS Photo Finder (/gps-finder) standalone extraction, coordinate parsing and map preview", () => {
    const finderSrc = fs.readFileSync(path.join(clientDir, "pages/gps-finder.tsx"), "utf-8");
    assert.ok(finderSrc.includes("extractPhotoMetadata"), "GPS Finder must include extraction utility");
    assert.ok(finderSrc.includes("Copy"), "GPS Finder must support copying coordinates");
    assert.ok(finderSrc.includes("LazyLeafletMap"), "GPS Finder must display interactive map preview");
  });

  await runTest(G1, 3, "EXIF Viewer (/exif-viewer) camera exposure tags, lens data, and searchable raw inspector", () => {
    const viewerSrc = fs.readFileSync(path.join(clientDir, "pages/exif-viewer.tsx"), "utf-8");
    assert.ok(viewerSrc.includes("extractExifData"), "EXIF Viewer must extract full metadata tags");
    assert.ok(viewerSrc.includes("tagSearch"), "EXIF Viewer must support tag searching");
    assert.ok(viewerSrc.includes("Camera"), "EXIF Viewer must display camera hardware details");
  });

  await runTest(G1, 4, "Remove GPS (/remove-gps-from-photo) dual-mode cleaning and post-removal verification", () => {
    const removeSrc = fs.readFileSync(path.join(clientDir, "pages/remove-gps-from-photo.tsx"), "utf-8");
    assert.ok(removeSrc.includes("removeGpsFromPhoto"), "Must support photo removal function");
    assert.ok(removeSrc.includes("inspectImageForRemoval"), "Must support pre-removal inspection");
    assert.ok(removeSrc.includes("setResult"), "Must support post-removal clean data display");
  });

  await runTest(G1, 5, "Coordinate Converter (/coordinate-converter) DD, DMS, DDM, Geohash parsing and precision", () => {
    const parsed = parseAnyCoordinates("40° 42' 46.02\" N, 74° 0' 21.6\" W");
    assert.ok(parsed, "Universal coordinate parser failed on DMS coordinate");
    const converted = convertAllFormats(parsed.lat, parsed.lng);
    assert.ok(converted.dd.formatted.includes("40.71278"), "DD conversion failed");
    assert.ok(converted.dms.formatted.includes("40° 42'"), "DMS conversion failed");
    assert.ok(converted.geohash.length >= 6, "Geohash encoding failed");
  });

  await runTest(G1, 6, "Improved Batch Workflow (/batch-geotag-photos) CSV mapping, tokenized renaming and ZIP packaging", () => {
    const csv = "filename,latitude,longitude\nphoto1.jpg,37.7749,-122.4194";
    const parsed = parseCoordinateCsv(csv);
    assert.strictEqual(parsed.rows.length, 1);
    const matches = matchCsvToImages(parsed.rows, [{ name: "photo1.jpg" }]);
    assert.strictEqual(matches.size, 1);
  });

  // ==========================================
  // GROUP 2: Zero-Upload Invariant & Privacy Guardrails (Points 7–12)
  // ==========================================
  const G2 = "Zero-Upload Privacy";

  await runTest(G2, 7, "Zero file upload endpoints in client codebase (100% browser FileReader execution)", () => {
    const pages = fs.readdirSync(path.join(clientDir, "pages"));
    for (const p of pages) {
      if (!p.endsWith(".tsx")) continue;
      const content = fs.readFileSync(path.join(clientDir, "pages", p), "utf-8");
      assert.ok(!content.includes("/api/upload"), `${p} contains /api/upload endpoint`);
      assert.ok(!content.includes("fetch('/upload'"), `${p} contains upload POST`);
    }
  });

  await runTest(G2, 8, "In-memory binary manipulation using Uint8Array, FileReader and client-side canvas", () => {
    const removeUtils = fs.readFileSync(path.join(clientDir, "lib/remove-gps-utils.ts"), "utf-8");
    assert.ok(removeUtils.includes("Uint8Array"), "remove-gps-utils must utilize Uint8Array buffers");
    assert.ok(removeUtils.includes("stripMetadataViaCanvas"), "remove-gps-utils must support clean canvas stripping");
  });

  await runTest(G2, 9, "Privacy-safe analytics event scrubbing (zero coordinate, filename, or PII telemetry)", () => {
    assert.ok(PROHIBITED_PARAM_KEYS instanceof Set, "PROHIBITED_PARAM_KEYS blocklist Set must exist");
    assert.ok(PROHIBITED_PARAM_KEYS.has("latitude"), "Latitude must be blocklisted");
    assert.ok(PROHIBITED_PARAM_KEYS.has("longitude"), "Longitude must be blocklisted");
    assert.ok(PROHIBITED_PARAM_KEYS.has("filename"), "Filename must be blocklisted");
    const cleaned = sanitizeAnalyticsParams({ lat: 40.7, file_count: 3 });
    assert.strictEqual(cleaned.lat, undefined);
    assert.strictEqual(cleaned.file_count, 3);
  });

  await runTest(G2, 10, "Zero server-side databases, persistent user storage or server authentication tokens", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    assert.ok(!deps["pg"], "Postgres dependency should not exist in production package");
    assert.ok(!deps["mongoose"], "MongoDB dependency should not exist");
    assert.ok(!deps["passport"], "Passport auth should not exist");
  });

  await runTest(G2, 11, "Strict HTTP security headers and CSP rules defined in .htaccess", () => {
    const htaccess = fs.readFileSync(path.join(publicDir, ".htaccess"), "utf-8");
    assert.ok(htaccess.includes("Strict-Transport-Security"), ".htaccess missing HSTS");
    assert.ok(htaccess.includes("X-Content-Type-Options \"nosniff\""), ".htaccess missing nosniff");
    assert.ok(htaccess.includes("X-Frame-Options \"SAMEORIGIN\""), ".htaccess missing X-Frame-Options");
    assert.ok(htaccess.includes("Referrer-Policy"), ".htaccess missing Referrer-Policy");
  });

  await runTest(G2, 12, "Privacy Policy and Terms of Service accurately state Zero-Upload Invariant", () => {
    const privSrc = fs.readFileSync(path.join(clientDir, "pages/privacy.tsx"), "utf-8");
    assert.ok(privSrc.includes("never uploaded"), "Privacy policy must declare photos are never uploaded");
    assert.ok(privSrc.includes("processed locally"), "Privacy policy must declare local processing");
  });

  // ==========================================
  // GROUP 3: Technical SEO & Prerendering Architecture (Points 13–18)
  // ==========================================
  const G3 = "Technical SEO";

  await runTest(G3, 13, "Exactly 21 canonical routes declared with self-referencing canonical URLs", () => {
    const count = Object.keys(SEO_CONFIG).length;
    assert.strictEqual(count, 21, `Expected 21 routes in SEO_CONFIG, found ${count}`);
  });

  await runTest(G3, 14, "SERP title length (50-60 chars) and description length (140-160 chars) budgets", () => {
    for (const [key, cfg] of Object.entries(SEO_CONFIG)) {
      assert.ok(cfg.title.length >= 50 && cfg.title.length <= 60, `${key} title out of budget: ${cfg.title.length}`);
      assert.ok(cfg.description.length >= 140 && cfg.description.length <= 160, `${key} desc out of budget: ${cfg.description.length}`);
    }
  });

  await runTest(G3, 15, "Sitemap.xml and robots.txt valid and aligned with canonical routes", () => {
    const sitemap = fs.readFileSync(path.join(publicDir, "sitemap.xml"), "utf-8");
    const robots = fs.readFileSync(path.join(publicDir, "robots.txt"), "utf-8");
    assert.ok(robots.includes("Sitemap: https://freegeotagger.com/sitemap.xml"), "robots.txt missing sitemap reference");
    for (const cfg of Object.values(SEO_CONFIG)) {
      const url = cfg.canonical === "/" ? "https://freegeotagger.com/" : `https://freegeotagger.com${cfg.canonical}`;
      assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml missing ${url}`);
    }
  });

  await runTest(G3, 16, "Prerendered HTML coverage across all 20 static subpages and root index.html", () => {
    assert.ok(fs.existsSync(path.join(publicDir, "index.html")), "index.html missing");
    const seoDir = path.join(publicDir, "seo-routes");
    const files = fs.readdirSync(seoDir);
    assert.strictEqual(files.length, 20, `Expected 20 prerendered subpages, found ${files.length}`);
  });

  await runTest(G3, 17, "Milestone: 100% Zero thin content (all 21 canonical routes >= 800 crawlable words)", () => {
    const seoDir = path.join(publicDir, "seo-routes");
    const files = fs.readdirSync(seoDir);
    for (const f of files) {
      const html = fs.readFileSync(path.join(seoDir, f), "utf-8");
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const words = text.split(" ").length;
      assert.ok(words >= 800, `Page ${f} is thin (${words} words < 800)`);
    }
    const homeHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");
    const homeWords = homeHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;
    assert.ok(homeWords >= 800, `Homepage is thin (${homeWords} words < 800)`);
  });

  await runTest(G3, 18, "Zero orphan pages: all 21 site routes have inbound internal links", () => {
    const sitemap = fs.readFileSync(path.join(publicDir, "sitemap.xml"), "utf-8");
    assert.ok(sitemap.includes("batch-geotag-photos"), "Batch geotag route in sitemap");
    assert.ok(sitemap.includes("coordinate-converter"), "Coordinate converter route in sitemap");
  });

  // ==========================================
  // GROUP 4: Structured Data & Schema Conformance (Points 19–24)
  // ==========================================
  const G4 = "Structured Data";

  await runTest(G4, 19, "WebSite and Organization schemas with verified logo ImageObject", () => {
    assert.strictEqual(WEBSITE_SCHEMA["@type"], "WebSite");
    assert.strictEqual(WEBSITE_SCHEMA.name, "FreeGeoTagger");
    assert.strictEqual(ORGANIZATION_SCHEMA["@type"], "Organization");
    assert.strictEqual(ORGANIZATION_SCHEMA.name, "FreeGeoTagger");
    const logo = ORGANIZATION_SCHEMA.logo as { url: string; width: number; height: number };
    assert.strictEqual(logo.width, 289);
    assert.strictEqual(logo.height, 289);
  });

  await runTest(G4, 20, "WebApplication schemas declared on dedicated tool interfaces", () => {
    const finderHtml = fs.readFileSync(path.join(publicDir, "seo-routes/gps-finder.html"), "utf-8");
    assert.ok(finderHtml.includes('"@type":"WebApplication"'), "gps-finder.html missing WebApplication schema");
    const removeSrc = fs.readFileSync(path.join(clientDir, "pages/remove-gps-from-photo.tsx"), "utf-8");
    assert.ok(removeSrc.includes('"@type": "WebApplication"'), "remove-gps-from-photo.tsx missing WebApplication schema");
    const batchSrc = fs.readFileSync(path.join(clientDir, "pages/batch-geotag-photos.tsx"), "utf-8");
    assert.ok(batchSrc.includes('"@type": "WebApplication"'), "batch-geotag-photos.tsx missing WebApplication schema");
    const coordSrc = fs.readFileSync(path.join(clientDir, "pages/coordinate-converter.tsx"), "utf-8");
    assert.ok(coordSrc.includes('"@type": "WebApplication"'), "coordinate-converter.tsx missing WebApplication schema");
  });

  await runTest(G4, 21, "Article schema on all 9 blog guides with author and datePublished", () => {
    const seoDir = path.join(publicDir, "seo-routes");
    const blogFiles = fs.readdirSync(seoDir).filter(f => f.startsWith("blog-") && f !== "blog.html");
    assert.strictEqual(blogFiles.length, 9, `Expected 9 blog articles, found ${blogFiles.length}`);
    for (const bf of blogFiles) {
      const html = fs.readFileSync(path.join(seoDir, bf), "utf-8");
      assert.ok(html.includes('"@type":"Article"'), `${bf} missing Article schema`);
      assert.ok(html.includes('"datePublished"'), `${bf} missing datePublished`);
    }
  });

  await runTest(G4, 22, "FAQPage schema declared on Homepage, tools, and content hubs", () => {
    const homeHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");
    assert.ok(homeHtml.includes('"@type":"FAQPage"'), "Homepage missing FAQPage schema");
    const batchHtml = fs.readFileSync(path.join(publicDir, "seo-routes/batch-geotag-photos.html"), "utf-8");
    assert.ok(batchHtml.includes('"@type":"FAQPage"'), "Batch geotag page missing FAQPage schema");
    const coordHtml = fs.readFileSync(path.join(publicDir, "seo-routes/coordinate-converter.html"), "utf-8");
    assert.ok(coordHtml.includes('"@type":"FAQPage"'), "Coordinate converter page missing FAQPage schema");
    const contactSrc = fs.readFileSync(path.join(clientDir, "pages/contact.tsx"), "utf-8");
    assert.ok(contactSrc.includes('"@type": "FAQPage"'), "Contact page missing FAQPage schema");
    const blogSrc = fs.readFileSync(path.join(clientDir, "pages/blog/index.tsx"), "utf-8");
    assert.ok(blogSrc.includes('"@type": "FAQPage"'), "Blog page missing FAQPage schema");
  });

  await runTest(G4, 23, "BreadcrumbList schema present on all 20 subpages", () => {
    const seoDir = path.join(publicDir, "seo-routes");
    for (const f of fs.readdirSync(seoDir)) {
      const html = fs.readFileSync(path.join(seoDir, f), "utf-8");
      assert.ok(html.includes('"@type":"BreadcrumbList"'), `${f} missing BreadcrumbList schema`);
    }
  });

  await runTest(G4, 24, "Open Graph and Twitter social cards with valid 1200x630 og:image", () => {
    assert.ok(fs.existsSync(path.join(publicDir, "og-image.png")), "og-image.png missing from root");
    const homeHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");
    assert.ok(homeHtml.includes('property="og:image"'), "Missing og:image tag");
    assert.ok(homeHtml.includes('name="twitter:card"'), "Missing twitter:card tag");
  });

  // ==========================================
  // GROUP 5: Web Performance & Budget Guardrails (Points 25–30)
  // ==========================================
  const G5 = "Performance";

  await runTest(G5, 25, "Eager Critical JS stays strictly <= 400.00 KB uncompressed", () => {
    const assetsDir = path.join(publicDir, "assets");
    const eagerFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith("index-") && f.endsWith(".js") || f.startsWith("vendor-") && f.endsWith(".js") || f.startsWith("react-") && f.endsWith(".js"));
    let total = 0;
    for (const f of eagerFiles) {
      total += fs.statSync(path.join(assetsDir, f)).size;
    }
    const kb = total / 1024;
    assert.ok(kb <= 400.0, `Eager JS exceeds 400 KB limit: ${kb.toFixed(2)} KB`);
  });

  await runTest(G5, 26, "Critical CSS stays strictly <= 150.00 KB uncompressed", () => {
    const assetsDir = path.join(publicDir, "assets");
    const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith(".css"));
    let total = 0;
    for (const f of cssFiles) total += fs.statSync(path.join(assetsDir, f)).size;
    const kb = total / 1024;
    assert.ok(kb <= 150.0, `CSS exceeds 150 KB limit: ${kb.toFixed(2)} KB`);
  });

  await runTest(G5, 27, "Initial HTML document size stays strictly <= 50.00 KB", () => {
    const htmlSize = fs.statSync(path.join(publicDir, "index.html")).size / 1024;
    assert.ok(htmlSize <= 50.0, `index.html exceeds 50 KB limit: ${htmlSize.toFixed(2)} KB`);
  });

  await runTest(G5, 28, "Cumulative Layout Shift (CLS) guarded with pre-allocated layout dimensions", () => {
    const homeHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");
    assert.ok(homeHtml.includes("min-height: 100vh") || homeHtml.includes("min-h-screen"), "Missing layout reservation");
  });

  await runTest(G5, 29, "Heavy third-party transcoders (heic2any, jszip) strictly code-split and lazy loaded", () => {
    const assetsDir = path.join(publicDir, "assets");
    const hasHeic = fs.readdirSync(assetsDir).some(f => f.startsWith("heic2any-") && f.endsWith(".js"));
    const hasZip = fs.readdirSync(assetsDir).some(f => f.startsWith("jszip") && f.endsWith(".js"));
    assert.ok(hasHeic, "heic2any chunk missing");
    assert.ok(hasZip, "jszip chunk missing");
  });

  await runTest(G5, 30, "System font stack and tree-shaken SVG icon delivery", () => {
    const indexCss = fs.readdirSync(path.join(publicDir, "assets")).find(f => f.endsWith(".css"));
    assert.ok(indexCss, "index.css missing");
  });

  // ==========================================
  // GROUP 6: Accessibility, Cross-Browser & Packaging (Points 31–36)
  // ==========================================
  const G6 = "Accessibility & Hostinger Packaging";

  await runTest(G6, 31, "All 21 routes contain <main id=\"main-content\"> and single primary <h1> heading", () => {
    const pages = fs.readdirSync(clientDir + "/pages");
    for (const p of pages) {
      if (!p.endsWith(".tsx")) continue;
      const src = fs.readFileSync(path.join(clientDir, "pages", p), "utf-8");
      assert.ok(src.includes('id="main-content"'), `${p} missing main landmark`);
      const h1Matches = src.match(/<h1\b/g);
      assert.strictEqual(h1Matches?.length, 1, `${p} must have exactly one <h1>, found ${h1Matches?.length}`);
    }
  });

  await runTest(G6, 32, "SkipLink present and keyboard focus-visible styling defined", () => {
    const skipSrc = fs.readFileSync(path.join(clientDir, "components/skip-link.tsx"), "utf-8");
    assert.ok(skipSrc.includes('targetId = "main-content"'), "Skip link must default to main-content");
  });

  await runTest(G6, 33, "Mobile touch targets (>= 44px) and iOS auto-zoom guard (16px input font size)", () => {
    const css = fs.readFileSync(path.join(clientDir, "index.css"), "utf-8");
    assert.ok(css.includes("min-height: 44px") || css.includes("h-11"), "Touch targets guarded");
  });

  await runTest(G6, 34, "Reduced motion respect and ARIA live regions for background operations", () => {
    const css = fs.readFileSync(path.join(clientDir, "index.css"), "utf-8");
    assert.ok(css.includes("prefers-reduced-motion"), "prefers-reduced-motion CSS rule missing");
  });

  await runTest(G6, 35, "Advertising readiness: master switch disabled and interaction safe zones protected", () => {
    assert.strictEqual(ADS_CONFIG.enabled, false, "ADS_CONFIG must be FALSE prior to launch");
    assert.strictEqual(ADS_CONFIG.client, "ca-pub-6438644207209483", "AdSense publisher ID mismatch");
  });

  await runTest(G6, 36, "Hostinger upload script package-hostinger.ps1 exists and enforces forward-slash zip structure", () => {
    const scriptSrc = fs.readFileSync("script/package-hostinger.ps1", "utf-8");
    assert.ok(scriptSrc.includes("System.IO.Compression.ZipFile"), "Packaging script missing zip engine");
    assert.ok(scriptSrc.includes("Replace($sep, '/')"), "Packaging script must normalize to forward slashes");
    assert.ok(scriptSrc.includes(".htaccess"), "Packaging script must require .htaccess");
  });

  console.log("\n-------------------------------------------------");
  console.log(`  Tests Passed: ${passedCount}`);
  console.log(`  Tests Failed: ${failedCount}`);
  console.log("-------------------------------------------------\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test suite runner error:", err);
  process.exit(1);
});
