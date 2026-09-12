/**
 * Automated Test Suite: Phase 11 — Bing + IndexNow
 *
 * Verifies:
 * 1. BingSiteAuth.xml file presence, validity, and format
 * 2. IndexNow key file existence, format, and keyLocation URL
 * 3. Bing verification meta tag in client/index.html
 * 4. Apache .htaccess rewrite exemption rules
 * 5. Strict canonical URL validation guardrails (blocks blobs, query params, foreign hosts, http)
 * 6. Full coverage of all 17 canonical routes
 * 7. Git change path mapper to canonical routes
 * 8. IndexNow payload structure and schema conformance
 * 9. Sanitized logging (masks API keys and redacts auth secrets)
 * 10. Dry-run submission execution
 */

import fs from "fs";
import path from "path";
import {
  DEFAULT_INDEXNOW_KEY,
  INDEXNOW_HOST,
  BING_SITE_AUTH_CODE,
  CANONICAL_ROUTES,
  getIndexNowKey,
  getKeyLocation,
  isValidCanonicalUrl,
  filterCanonicalUrls,
  createIndexNowPayload,
  mapChangedFilesToUrls,
  sanitizeLog,
  maskKey,
  submitToIndexNow,
} from "../server/indexnow";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failed++;
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("  FREEGEOTAGGER PHASE 11 BING + INDEXNOW TESTS   ");
  console.log("=================================================\n");

  const projectDir = process.cwd();
  const publicDir = path.join(projectDir, "client", "public");

  // 1. BingSiteAuth.xml file check
  const bingAuthFile = path.join(publicDir, "BingSiteAuth.xml");
  assert(fs.existsSync(bingAuthFile), "BingSiteAuth.xml exists in client/public");
  if (fs.existsSync(bingAuthFile)) {
    const xmlContent = fs.readFileSync(bingAuthFile, "utf8");
    assert(
      xmlContent.includes("<users>") &&
        xmlContent.includes("<user>") &&
        xmlContent.includes(BING_SITE_AUTH_CODE),
      "BingSiteAuth.xml contains valid <users><user> structure with verification code"
    );
  }

  // 2. IndexNow key file check
  const activeKey = getIndexNowKey();
  const keyFile = path.join(publicDir, `${activeKey}.txt`);
  assert(fs.existsSync(keyFile), `IndexNow key file ${activeKey}.txt exists in client/public`);
  if (fs.existsSync(keyFile)) {
    const keyContent = fs.readFileSync(keyFile, "utf8").trim();
    assert(keyContent === activeKey, "IndexNow key file contains exact matching key");
    assert(/^[a-f0-9]{32,128}$/i.test(keyContent), "IndexNow key is a valid hex string");
  }

  // 3. keyLocation URL check
  const expectedLocation = `https://${INDEXNOW_HOST}/${activeKey}.txt`;
  assert(
    getKeyLocation(activeKey, INDEXNOW_HOST) === expectedLocation,
    `keyLocation URL matches ${expectedLocation}`
  );

  // 4. Bing HTML verification meta tag in client/index.html
  const indexHtmlPath = path.join(projectDir, "client", "index.html");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  assert(
    indexHtml.includes('<meta name="msvalidate.01" content="') &&
      indexHtml.includes(BING_SITE_AUTH_CODE),
    "client/index.html includes msvalidate.01 meta tag with valid Bing verification code"
  );

  // 5. Apache .htaccess configuration check
  const htaccessPath = path.join(publicDir, ".htaccess");
  const htaccess = fs.readFileSync(htaccessPath, "utf8");
  assert(
    htaccess.includes("BingSiteAuth") && htaccess.includes("^BingSiteAuth"),
    ".htaccess includes direct exemption rule for BingSiteAuth.xml"
  );
  assert(
    htaccess.includes("[a-f0-9]{32,128}") && htaccess.includes(".txt"),
    ".htaccess includes direct exemption rule for IndexNow key text file"
  );

  // 6. Canonical URL validation guardrails
  console.log("\n-- Security & URL Validation Guardrails --");
  assert(
    !isValidCanonicalUrl("blob:https://freegeotagger.com/1234-uuid"),
    "Rejects blob URLs"
  );
  assert(
    !isValidCanonicalUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg"),
    "Rejects data URIs"
  );
  assert(
    !isValidCanonicalUrl("http://freegeotagger.com/"),
    "Rejects non-HTTPS HTTP URLs"
  );
  assert(
    !isValidCanonicalUrl("https://localhost:5000/"),
    "Rejects localhost URLs"
  );
  assert(
    !isValidCanonicalUrl("https://127.0.0.1/"),
    "Rejects IP addresses"
  );
  assert(
    !isValidCanonicalUrl("https://external-site.com/"),
    "Rejects foreign hosts"
  );
  assert(
    !isValidCanonicalUrl("https://freegeotagger.com/?query=test"),
    "Rejects URLs with query parameters"
  );
  assert(
    !isValidCanonicalUrl("https://freegeotagger.com/#section"),
    "Rejects URLs with hash anchors"
  );
  assert(
    !isValidCanonicalUrl("https://freegeotagger.com/404.html"),
    "Rejects non-canonical / 404 pages"
  );
  assert(
    !isValidCanonicalUrl("https://freegeotagger.com/invalid-route"),
    "Rejects unapproved routes"
  );

  // 7. Canonical Routes Coverage
  console.log("\n-- Canonical Routes Coverage (21/21) --");
  assert(CANONICAL_ROUTES.length === 21, "Exactly 21 canonical routes defined");
  let allRoutesValid = true;
  for (const route of CANONICAL_ROUTES) {
    const fullUrl = `https://${INDEXNOW_HOST}${route === "/" ? "/" : route}`;
    if (!isValidCanonicalUrl(fullUrl)) {
      allRoutesValid = false;
      console.error(`Failed validation on route: ${fullUrl}`);
    }
  }
  assert(allRoutesValid, "All 21 canonical site routes pass URL validation");

  // 8. Git change path mapper
  console.log("\n-- Git Changed Files Mapper --");
  const sampleChangedFiles = [
    "client/src/pages/home.tsx",
    "client/src/pages/gps-finder.tsx",
    "client/src/pages/exif-viewer.tsx",
    "client/src/pages/blog/how-to-bulk-geotag-photos.tsx",
    "README.md", // Should be ignored (not a page)
    "package.json", // Should be ignored
  ];
  const mappedUrls = mapChangedFilesToUrls(sampleChangedFiles, INDEXNOW_HOST);
  assert(
    mappedUrls.includes("https://freegeotagger.com/") &&
      mappedUrls.includes("https://freegeotagger.com/gps-finder") &&
      mappedUrls.includes("https://freegeotagger.com/exif-viewer") &&
      mappedUrls.includes("https://freegeotagger.com/blog/how-to-bulk-geotag-photos") &&
      mappedUrls.length === 4,
    "mapChangedFilesToUrls correctly maps source files to canonical URLs and ignores non-page files"
  );

  // 9. IndexNow Payload generation & deduplication
  console.log("\n-- IndexNow Payload & Schema Conformance --");
  const payloadTest = createIndexNowPayload(
    [
      "https://freegeotagger.com/",
      "https://freegeotagger.com/", // Duplicate
      "https://freegeotagger.com/gps-finder",
    ],
    { host: INDEXNOW_HOST, key: activeKey }
  );
  assert(payloadTest.valid === true, "createIndexNowPayload returns valid: true for valid URLs");
  assert(
    payloadTest.payload?.urlList.length === 2,
    "createIndexNowPayload deduplicates redundant URL entries"
  );
  assert(
    payloadTest.payload?.host === INDEXNOW_HOST &&
      payloadTest.payload?.key === activeKey &&
      payloadTest.payload?.keyLocation === expectedLocation,
    "Payload contains correct host, key, and keyLocation"
  );

  // 10. Sanitized Logging (Security)
  console.log("\n-- Sanitized Logging & Secret Redaction --");
  const rawLog = `Submitting to IndexNow with key ${activeKey} and auth Bearer secret_token_xyz`;
  const sanitized = sanitizeLog(rawLog, activeKey);
  assert(
    !sanitized.includes(activeKey) && sanitized.includes(maskKey(activeKey)),
    "sanitizeLog masks full IndexNow API key"
  );
  assert(
    !sanitized.includes("secret_token_xyz") && sanitized.includes("Bearer [REDACTED]"),
    "sanitizeLog redacts Bearer authorization tokens"
  );

  // 11. Dry-run submission test
  console.log("\n-- Dry-Run Submission Execution --");
  const dryRunResult = await submitToIndexNow(payloadTest.payload!, {
    dryRun: true,
    logger: () => {}, // silent in tests
  });
  assert(
    dryRunResult.success === true &&
      dryRunResult.mode === "dry-run" &&
      dryRunResult.submittedCount === 2 &&
      dryRunResult.status === 200,
    "submitToIndexNow dry-run returns success: true and status: 200 with zero external network requests"
  );

  console.log("\n-------------------------------------------------");
  console.log(`  Tests Passed: ${passed}`);
  console.log(`  Tests Failed: ${failed}`);
  console.log("-------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
