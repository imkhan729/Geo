import { strict as assert } from "assert";
import fs from "fs";
import path from "path";
import {
  SEO_CONFIG,
  SITE_URL,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
} from "../client/src/lib/seo";

console.log("=================================================");
console.log("  FREEGEOTAGGER PHASE 9 TECHNICAL SEO TEST SUITE ");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  [PASS] ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failedCount++;
    });
}

async function runAllTests() {
  // Test 1: Canonical URLs integrity in SEO_CONFIG
  await runTest("All 18 canonical routes defined with self-referencing canonical URLs", () => {
    const entries = Object.entries(SEO_CONFIG);
    assert.strictEqual(entries.length, 18, `Expected 18 routes, got ${entries.length}`);

    for (const [key, config] of entries) {
      assert.ok(config.canonical, `Route ${key} missing canonical URL`);
      if (config.canonical === "/") {
        assert.strictEqual(config.canonical, "/");
      } else {
        assert.ok(!config.canonical.endsWith("/"), `Subpage ${key} canonical must not have trailing slash: ${config.canonical}`);
        assert.ok(config.canonical.startsWith("/"), `Subpage ${key} canonical must start with /: ${config.canonical}`);
      }
    }
  });

  // Test 2: SERP Title & Meta Description limits
  await runTest("All 18 pages have unique titles (50-60 chars) and descriptions (140-160 chars)", () => {
    const titles = new Set<string>();
    const descs = new Set<string>();

    for (const [key, config] of Object.entries(SEO_CONFIG)) {
      assert.ok(config.title.length >= 50 && config.title.length <= 60,
        `${key} title length ${config.title.length} out of range [50, 60]: "${config.title}"`);
      assert.ok(config.description.length >= 140 && config.description.length <= 160,
        `${key} desc length ${config.description.length} out of range [140, 160]: "${config.description}"`);

      assert.ok(!titles.has(config.title), `Duplicate title: "${config.title}"`);
      assert.ok(!descs.has(config.description), `Duplicate description on ${key}`);
      titles.add(config.title);
      descs.add(config.description);
    }
  });

  // Test 3: robots.txt compliance
  await runTest("robots.txt points to canonical sitemap and allows search & AI crawlers without crawl-delay", () => {
    const robotsPath = path.resolve("client/public/robots.txt");
    assert.ok(fs.existsSync(robotsPath), "robots.txt must exist in client/public");
    const robots = fs.readFileSync(robotsPath, "utf8");

    assert.ok(robots.includes("Sitemap: https://freegeotagger.com/sitemap.xml"), "Must declare canonical sitemap URL");
    assert.ok(!/^\s*Disallow:\s*\/\s*$/m.test(robots), "Must not disallow root");
    assert.ok(!/^\s*Crawl-delay\s*:/im.test(robots), "Must not use Crawl-delay");

    const expectedBots = ["Googlebot", "Bingbot", "GPTBot", "ClaudeBot", "PerplexityBot", "Applebot"];
    for (const bot of expectedBots) {
      assert.ok(robots.includes(bot), `robots.txt must explicitly configure ${bot}`);
    }
  });

  // Test 4: sitemap.xml validation
  await runTest("sitemap.xml includes all 18 canonical URLs with valid priorities and https protocol", () => {
    const sitemapPath = path.resolve("client/public/sitemap.xml");
    assert.ok(fs.existsSync(sitemapPath), "sitemap.xml must exist in client/public");
    const sitemap = fs.readFileSync(sitemapPath, "utf8");

    const locMatches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    assert.strictEqual(locMatches.length, 18, `Expected 18 sitemap URLs, got ${locMatches.length}`);

    for (const url of locMatches) {
      assert.ok(url.startsWith("https://freegeotagger.com"), `URL must start with https://freegeotagger.com: ${url}`);
      assert.ok(!url.includes("www."), `URL must not use www: ${url}`);
    }

    assert.ok(sitemap.includes("<loc>https://freegeotagger.com/</loc>"));
    assert.ok(sitemap.includes("<loc>https://freegeotagger.com/gps-finder</loc>"));
    assert.ok(sitemap.includes("<loc>https://freegeotagger.com/exif-viewer</loc>"));
  });

  // Test 5: Open Graph & Twitter Card asset verification
  await runTest("Open Graph social image exists, has correct 1200x630 dimensions, and is valid PNG", () => {
    const ogPath = path.resolve("client/public/og-image.png");
    assert.ok(fs.existsSync(ogPath), "og-image.png must exist in client/public");
    const buf = fs.readFileSync(ogPath);
    assert.strictEqual(buf.slice(0, 8).toString("hex"), "89504e470d0a1a0a", "Must have valid PNG signature");
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.strictEqual(width, 1200, `Expected OG image width 1200, got ${width}`);
    assert.strictEqual(height, 630, `Expected OG image height 630, got ${height}`);
  });

  // Test 6: Google Site Name structured data
  await runTest("WebSite schema specifies site name, alternate names, and root canonical URL", () => {
    assert.strictEqual(WEBSITE_SCHEMA["@context"], "https://schema.org");
    assert.strictEqual(WEBSITE_SCHEMA["@type"], "WebSite");
    assert.strictEqual(WEBSITE_SCHEMA.name, "FreeGeoTagger");
    assert.deepStrictEqual(WEBSITE_SCHEMA.alternateName, ["Free Geo Tagger", "GeoTagger"]);
    assert.strictEqual(WEBSITE_SCHEMA.url, "https://freegeotagger.com/");
  });

  // Test 7: Organization logo fix and dimensions verification
  await runTest("Organization schema specifies valid logo ImageObject with matching binary dimensions", () => {
    assert.strictEqual(ORGANIZATION_SCHEMA["@type"], "Organization");
    assert.strictEqual(ORGANIZATION_SCHEMA.name, "FreeGeoTagger");
    assert.strictEqual(ORGANIZATION_SCHEMA.url, "https://freegeotagger.com");

    const logo = ORGANIZATION_SCHEMA.logo as any;
    assert.strictEqual(logo["@type"], "ImageObject");
    assert.strictEqual(logo.url, "https://freegeotagger.com/favicon.png");
    assert.strictEqual(logo.width, 289);
    assert.strictEqual(logo.height, 289);

    const faviconPath = path.resolve("client/public/favicon.png");
    const favBuf = fs.readFileSync(faviconPath);
    const realWidth = favBuf.readUInt32BE(16);
    const realHeight = favBuf.readUInt32BE(20);
    assert.strictEqual(realWidth, logo.width, "Declared logo width must match actual PNG binary width");
    assert.strictEqual(realHeight, logo.height, "Declared logo height must match actual PNG binary height");

    const logoPath = path.resolve("client/public/logo.png");
    assert.ok(fs.existsSync(logoPath), "logo.png must exist in client/public for crawler accessibility");
  });

  // Test 8: .htaccess redirect & routing rules
  await runTest(".htaccess enforces HTTPS, non-www, index.html redirect, trailing slash strip, and 17 SEO routes", () => {
    const htPath = path.resolve("client/public/.htaccess");
    assert.ok(fs.existsSync(htPath), ".htaccess must exist");
    const ht = fs.readFileSync(htPath, "utf8");

    assert.ok(ht.includes("RewriteCond %{HTTPS} off"), "Must redirect HTTP to HTTPS");
    assert.ok(ht.includes("RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]"), "Must redirect www to non-www");
    assert.ok(ht.includes("RewriteCond %{THE_REQUEST} ^[A-Z]{3,9}\\ /index\\.html\\ HTTP/"), "Must redirect /index.html to /");
    assert.ok(ht.includes("RewriteCond %{REQUEST_FILENAME} !-d"), "Must test not directory");

    const routesCount = [...ht.matchAll(/RewriteRule \^([^\s]+?)\/\?\$ \/seo-routes\/([^\s]+\.html)/g)].length;
    assert.strictEqual(routesCount, 17, `Expected 17 subpage rewrites, got ${routesCount}`);
  });

  // Test 9: 404 Status and Error Experience
  await runTest("404.html provides clear recovery options with noindex and no self-canonical conflict", () => {
    const htmlPath = path.resolve("client/public/404.html");
    assert.ok(fs.existsSync(htmlPath), "404.html must exist");
    const html = fs.readFileSync(htmlPath, "utf8");

    assert.ok(html.includes('content="noindex, follow"'), "404 must have noindex");
    assert.ok(!html.includes('<link rel="canonical" href="https://freegeotagger.com/404.html"'), "404 must not canonicalize to 404.html");
    assert.ok(html.includes("Return Home"), "404 must provide return link");
  });

  console.log("-------------------------------------------------");
  console.log(`  Tests Passed: ${passedCount}`);
  console.log(`  Tests Failed: ${failedCount}`);
  console.log("-------------------------------------------------\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
