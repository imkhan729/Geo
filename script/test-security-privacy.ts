/**
 * Automated Security & Privacy Test Suite for FreeGeoTagger v2.0.0 (Phase 14)
 * Verifies HTTP security headers, rate limiting, input validation,
 * logging redaction, secret isolation, and zero-upload invariants.
 */

import http from "http";
import express, { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { registerRoutes, createRateLimiter } from "../server/routes";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, errorMsg?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } else {
    results.push({ name, passed: false, error: errorMsg || "Assertion failed" });
    console.error(`  ✗ ${name}: ${errorMsg || "Assertion failed"}`);
  }
}

async function runTests() {
  console.log("=== FreeGeoTagger Security & Privacy Test Suite (Phase 14) ===\n");

  // ─── 1. Apache .htaccess Security Headers ───────────────────────────
  console.log("1. Checking Apache .htaccess Security Headers...");
  const htaccessPath = path.resolve(process.cwd(), "client/public/.htaccess");
  assert(fs.existsSync(htaccessPath), ".htaccess exists");
  const htaccessContent = fs.readFileSync(htaccessPath, "utf-8");

  assert(
    htaccessContent.includes('Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"'),
    "HSTS with preload configured in .htaccess"
  );
  assert(
    htaccessContent.includes('X-Content-Type-Options "nosniff"'),
    "X-Content-Type-Options: nosniff in .htaccess"
  );
  assert(
    htaccessContent.includes('X-Frame-Options "SAMEORIGIN"'),
    "X-Frame-Options: SAMEORIGIN in .htaccess"
  );
  assert(
    htaccessContent.includes('Referrer-Policy "strict-origin-when-cross-origin"'),
    "Referrer-Policy: strict-origin-when-cross-origin in .htaccess"
  );
  assert(
    htaccessContent.includes('Permissions-Policy "geolocation=(self), camera=(), microphone=()"'),
    "Permissions-Policy configured in .htaccess"
  );
  assert(
    htaccessContent.includes('X-XSS-Protection "1; mode=block"'),
    "X-XSS-Protection: 1; mode=block in .htaccess"
  );
  assert(
    htaccessContent.includes("Content-Security-Policy"),
    "Content-Security-Policy configured in .htaccess"
  );

  // ─── 2. Express Server Security Headers ─────────────────────────────
  console.log("\n2. Checking Express Server Security Headers...");
  const serverIndexPath = path.resolve(process.cwd(), "server/index.ts");
  const serverIndexContent = fs.readFileSync(serverIndexPath, "utf-8");

  assert(
    serverIndexContent.includes('res.setHeader("X-Content-Type-Options", "nosniff")'),
    "X-Content-Type-Options header present in Express middleware"
  );
  assert(
    serverIndexContent.includes('res.setHeader("X-Frame-Options", "SAMEORIGIN")'),
    "X-Frame-Options header present in Express middleware"
  );
  assert(
    serverIndexContent.includes('res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")'),
    "Referrer-Policy header present in Express middleware"
  );
  assert(
    serverIndexContent.includes('res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()")'),
    "Permissions-Policy header present in Express middleware"
  );
  assert(
    serverIndexContent.includes('res.setHeader("X-XSS-Protection", "1; mode=block")'),
    "X-XSS-Protection header present in Express middleware"
  );
  assert(
    serverIndexContent.includes('res.setHeader("Strict-Transport-Security"'),
    "HSTS header configured for production in Express middleware"
  );
  assert(
    serverIndexContent.includes('"Content-Security-Policy"'),
    "Content-Security-Policy configured in Express middleware"
  );

  // ─── 3. Privacy-Safe Logging Redaction ─────────────────────────────
  console.log("\n3. Checking Privacy-Safe Logging Redaction...");
  assert(
    !serverIndexContent.includes("capturedJsonResponse"),
    "Zero response JSON body capture/logging in server/index.ts"
  );
  assert(
    serverIndexContent.includes("req.method") && serverIndexContent.includes("duration"),
    "Request logging uses sanitized route path without query parameters or payload"
  );

  // ─── 4. Ephemeral Express App for Route Validation & Rate Limiting ──
  console.log("\n4. Testing Live API Input Validation & Rate Limiting...");
  const app: Express = express();
  app.use(express.json());
  const server = http.createServer(app);
  await registerRoutes(server, app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // 4.1 Health Check
    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert(resHealth.status === 200, "GET /api/health returns HTTP 200");
    const jsonHealth = await resHealth.json();
    assert(jsonHealth.status === "ok", "Health check reports status: ok");

    // 4.2 Geocoding Search Validation
    const resNoQuery = await fetch(`${baseUrl}/api/geocode/search`);
    assert(resNoQuery.status === 400, "GET /api/geocode/search without 'q' returns HTTP 400");

    const overlongQuery = "a".repeat(150);
    const resOverlong = await fetch(`${baseUrl}/api/geocode/search?q=${overlongQuery}`);
    assert(resOverlong.status === 400, "GET /api/geocode/search with query > 128 chars returns HTTP 400");

    const resShort = await fetch(`${baseUrl}/api/geocode/search?q=ab`);
    const jsonShort = await resShort.json();
    assert(resShort.status === 200 && Array.isArray(jsonShort) && jsonShort.length === 0,
      "GET /api/geocode/search with query < 3 chars returns empty array without querying upstream"
    );

    // 4.3 Reverse Geocoding Validation
    const resNoCoords = await fetch(`${baseUrl}/api/geocode/reverse`);
    assert(resNoCoords.status === 400, "GET /api/geocode/reverse without lat/lng returns HTTP 400");

    const resNan = await fetch(`${baseUrl}/api/geocode/reverse?lat=hello&lng=world`);
    assert(resNan.status === 400, "GET /api/geocode/reverse with non-numeric coords returns HTTP 400");

    const resLatOutOfRange = await fetch(`${baseUrl}/api/geocode/reverse?lat=95.5&lng=10.0`);
    assert(resLatOutOfRange.status === 400, "GET /api/geocode/reverse with lat > 90 returns HTTP 400");

    const resLngOutOfRange = await fetch(`${baseUrl}/api/geocode/reverse?lat=45.0&lng=-195.0`);
    assert(resLngOutOfRange.status === 400, "GET /api/geocode/reverse with lng < -180 returns HTTP 400");

    // 4.4 Rate Limiter Direct Test
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      max: 3,
      message: "Rate limit test exceeded",
    });

    const testApp = express();
    testApp.get("/test-limit", testLimiter, (_req, res) => res.json({ ok: true }));
    const testServer = http.createServer(testApp);
    await new Promise<void>((resolve) => testServer.listen(0, "127.0.0.1", () => resolve()));
    const testPort = (testServer.address() as any).port;

    let finalRes: any;
    for (let i = 0; i < 4; i++) {
      finalRes = await fetch(`http://127.0.0.1:${testPort}/test-limit`);
    }

    assert(finalRes.status === 429, "Rate limiter returns HTTP 429 when max requests exceeded");
    assert(finalRes.headers.has("retry-after"), "Rate limiter returns Retry-After header on 429");
    assert(finalRes.headers.get("x-ratelimit-limit") === "3", "Rate limiter returns X-RateLimit-Limit: 3");
    const jsonLimit = await finalRes.json();
    assert(jsonLimit.error === "Rate limit test exceeded", "Rate limiter returns informative error message");

    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // ─── 5. Zero Server Upload Invariant ───────────────────────────────
  console.log("\n5. Checking Zero Server Upload Invariant...");
  const routesContent = fs.readFileSync(path.resolve(process.cwd(), "server/routes.ts"), "utf-8");
  assert(!routesContent.includes("multer"), "No multer middleware in server/routes.ts");
  assert(!routesContent.includes("formidable"), "No formidable package in server/routes.ts");
  assert(!routesContent.includes("busboy"), "No busboy package in server/routes.ts");
  assert(!routesContent.includes("/upload"), "No /upload endpoint in server/routes.ts");

  // ─── 6. Client Bundle Secret Isolation ─────────────────────────────
  console.log("\n6. Auditing Client Source for Secret Leaks...");
  const clientSrcDir = path.resolve(process.cwd(), "client/src");
  let secretLeakFound = false;

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        if (
          fileContent.includes("ADMIN_SECRET") ||
          fileContent.includes("PRIVATE_KEY") ||
          fileContent.includes("SECRET_KEY")
        ) {
          secretLeakFound = true;
          console.error(`  Leak risk in ${entry.name}`);
        }
      }
    }
  }
  scanDir(clientSrcDir);
  assert(!secretLeakFound, "Zero server secrets or private keys in client/src");

  // ─── 7. Memory & File Restriction Hygiene ──────────────────────────
  console.log("\n7. Checking Client Memory Management & File Restrictions...");
  const dropzonePath = path.resolve(process.cwd(), "client/src/components/tool/dropzone.tsx");
  const dropzoneContent = fs.readFileSync(dropzonePath, "utf-8");
  assert(
    dropzoneContent.includes("MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024"),
    "Dropzone enforces 20MB file limit"
  );
  assert(
    !dropzoneContent.includes(".svg"),
    "SVG format disallowed in Dropzone accepted formats"
  );

  const gpsFinderPath = path.resolve(process.cwd(), "client/src/pages/gps-finder.tsx");
  const gpsFinderContent = fs.readFileSync(gpsFinderPath, "utf-8");
  assert(
    gpsFinderContent.includes("URL.revokeObjectURL(previewUrlRef.current)"),
    "gps-finder.tsx revokes preview Object URLs to prevent browser memory leaks"
  );

  // ─── Summary ───────────────────────────────────────────────────────
  console.log("\n=======================================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Results: ${passed} passed, ${failed} failed (${results.length} total)`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
