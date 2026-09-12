import { strict as assert } from "assert";
import https from "https";
import http from "http";
import { SEO_CONFIG, SITE_URL } from "../client/src/lib/seo";

console.log("=================================================");
console.log("  FREEGEOTAGGER PHASE 20 POST-LAUNCH LIVE QA     ");
console.log("  PRODUCTION ENDPOINT HEALTH VERIFICATION        ");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function fetchUrl(urlStr: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(urlStr, { headers: { "User-Agent": "FreeGeoTagger-QA-Bot/1.0" }, timeout: 10000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode || 0, headers: res.headers, body: data });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${urlStr}`));
    });
  });
}

function runTest(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  [PASS] ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  [WARN/FAIL] ${name}`);
      console.error(`              Details: ${err.message}`);
      failedCount++;
    });
}

async function runAllLiveTests() {
  console.log("Checking live production host: " + SITE_URL);

  // 1. Root Homepage & HTTPS check
  await runTest("Homepage (https://freegeotagger.com/) returns 200 OK with valid HTML", async () => {
    const res = await fetchUrl("https://freegeotagger.com/");
    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}`);
    assert.ok(res.body.includes("<!DOCTYPE html>"), "Missing DOCTYPE");
    assert.ok(res.body.includes("<title>"), "Missing title tag");
  });

  // 2. Canonical sitemap.xml check
  await runTest("Sitemap (https://freegeotagger.com/sitemap.xml) is accessible with 200 OK", async () => {
    const res = await fetchUrl("https://freegeotagger.com/sitemap.xml");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes("<urlset"), "Invalid sitemap XML");
  });

  // 3. Robots.txt check
  await runTest("Robots.txt (https://freegeotagger.com/robots.txt) references sitemap and allows crawlers", async () => {
    const res = await fetchUrl("https://freegeotagger.com/robots.txt");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes("Sitemap: https://freegeotagger.com/sitemap.xml"), "Missing sitemap link in robots.txt");
  });

  // 4. IndexNow key file check
  await runTest("IndexNow verification key (https://freegeotagger.com/f83e29a0b14c46f6a73d819e6d0a7f14.txt) returns 200 OK", async () => {
    const res = await fetchUrl("https://freegeotagger.com/f83e29a0b14c46f6a73d819e6d0a7f14.txt");
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.trim(), "f83e29a0b14c46f6a73d819e6d0a7f14");
  });

  // 5. Bing site auth XML check
  await runTest("BingSiteAuth.xml is accessible with valid verification token", async () => {
    const res = await fetchUrl("https://freegeotagger.com/BingSiteAuth.xml");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes("<user>CBEFD8E2A2775E06FE08CC6C91350FE7</user>"), "Bing auth token mismatch");
  });

  // 6. ads.txt check
  await runTest("ads.txt (https://freegeotagger.com/ads.txt) returns 200 OK with correct publisher ID", async () => {
    const res = await fetchUrl("https://freegeotagger.com/ads.txt");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes("pub-6438644207209483"), "ads.txt publisher ID mismatch");
  });

  // 7. Core Tool Routes sample check
  const sampleRoutes = ["/gps-finder", "/exif-viewer", "/remove-gps-from-photo", "/coordinate-converter", "/batch-geotag-photos", "/about", "/contact", "/blog"];
  for (const route of sampleRoutes) {
    await runTest(`Live Route ${route} returns 200 OK`, async () => {
      const res = await fetchUrl(`https://freegeotagger.com${route}`);
      assert.strictEqual(res.statusCode, 200, `Expected 200 for ${route}, got ${res.statusCode}`);
    });
  }

  console.log("\n-------------------------------------------------");
  console.log(`  Live Checks Passed: ${passedCount}`);
  console.log(`  Live Checks Failed: ${failedCount}`);
  console.log("-------------------------------------------------\n");
}

runAllLiveTests().catch((err) => {
  console.error("Live test suite execution error:", err);
});
