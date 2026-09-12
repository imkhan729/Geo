/**
 * Automated Test Suite: Phase 15 — Analytics & Conversion Measurement
 */

import {
  PROHIBITED_PARAM_KEYS,
  sanitizeAnalyticsParams,
  getVitalRating,
} from "../client/src/lib/analytics";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log("  ✓ " + testName);
    passed++;
  } else {
    console.error("  ✗ FAIL: " + testName);
    failed++;
  }
}

console.log("\n🧪 Running Phase 15 Analytics Verification Suite...\n");

// ── Test Group 1: Parameter Blocklist Sanitization ──
console.log("Group 1: Parameter Blocklist Sanitization");

const dirtyParams: Record<string, unknown> = {
  file_count: 5,
  format_family: "jpeg",
  processing_mode: "batch",
  lat: 40.7128,
  latitude: 40.7128,
  lng: -74.006,
  lon: -74.006,
  longitude: -74.006,
  coordinates: "40.7128, -74.0060",
  filename: "private-photo.jpg",
  fileName: "family-vacation.png",
  name: "secret.jpg",
  address: "1600 Pennsylvania Avenue",
  street: "Main St",
  city: "New York",
  zip: "10001",
  postal: "90210",
  query: "Times Square",
  search: "Paris Eiffel Tower",
  exif: { make: "Apple", model: "iPhone 15" },
  bytes: 1048576,
  dataUrl: "data:image/jpeg;base64,...",
  imageData: "blob:...",
  email: "user@example.com",
};

const clean = sanitizeAnalyticsParams(dirtyParams);

assert(clean !== undefined, "Sanitizer returns object for valid input");
assert(clean?.file_count === 5, "Preserves safe numeric parameter file_count");
assert(clean?.format_family === "jpeg", "Preserves safe string parameter format_family");
assert(clean?.processing_mode === "batch", "Preserves safe string parameter processing_mode");

for (const key of Object.keys(dirtyParams)) {
  if (["file_count", "format_family", "processing_mode"].includes(key)) continue;
  assert(clean?.[key] === undefined, "Prohibited key " + key + " was stripped from event payload");
}

// ── Test Group 2: Coordinate & Email Value Scrubbing ──
console.log("\nGroup 2: Coordinate & Email Value Scrubbing");

const coordinateValues = {
  safe_note: "test message",
  leaked_dd_coord: "40.712776",
  leaked_negative_coord: "-73.985428",
  leaked_email: "contact@privacy.org",
  safe_category: "general_error",
};

const scrubbed = sanitizeAnalyticsParams(coordinateValues);
assert(scrubbed?.safe_note === "test message", "Safe note is preserved");
assert(scrubbed?.safe_category === "general_error", "Safe category is preserved");
assert(scrubbed?.leaked_dd_coord === undefined, "Scrubbed decimal coordinate value");
assert(scrubbed?.leaked_negative_coord === undefined, "Scrubbed negative decimal coordinate value");
assert(scrubbed?.leaked_email === undefined, "Scrubbed email pattern value");

// ── Test Group 3: Core Web Vitals Rating Logic ──
console.log("\nGroup 3: Core Web Vitals Ratings");

assert(getVitalRating("LCP", 1200) === "good", "LCP 1200ms is good");
assert(getVitalRating("LCP", 2500) === "good", "LCP 2500ms is good");
assert(getVitalRating("LCP", 3000) === "needs_improvement", "LCP 3000ms needs improvement");
assert(getVitalRating("LCP", 4500) === "poor", "LCP 4500ms is poor");

assert(getVitalRating("CLS", 0.0) === "good", "CLS 0.0 is good");
assert(getVitalRating("CLS", 0.05) === "good", "CLS 0.05 is good");
assert(getVitalRating("CLS", 0.15) === "needs_improvement", "CLS 0.15 needs improvement");
assert(getVitalRating("CLS", 0.3) === "poor", "CLS 0.3 is poor");

assert(getVitalRating("INP", 50) === "good", "INP 50ms is good");
assert(getVitalRating("INP", 250) === "needs_improvement", "INP 250ms needs improvement");
assert(getVitalRating("INP", 600) === "poor", "INP 600ms is poor");

assert(getVitalRating("FCP", 800) === "good", "FCP 800ms is good");
assert(getVitalRating("FCP", 2200) === "needs_improvement", "FCP 2200ms needs improvement");
assert(getVitalRating("FCP", 3500) === "poor", "FCP 3500ms is poor");

assert(getVitalRating("TTFB", 200) === "good", "TTFB 200ms is good");
assert(getVitalRating("TTFB", 1200) === "needs_improvement", "TTFB 1200ms needs improvement");
assert(getVitalRating("TTFB", 2500) === "poor", "TTFB 2500ms is poor");

// ── Test Group 4: Codebase Audit for Sensitive Telemetry ──
console.log("\nGroup 4: Codebase Audit for Prohibited Analytics Telemetry");

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist") {
        scanDirectory(fullPath, fileList);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const clientFiles = scanDirectory(path.resolve(process.cwd(), "client/src"));
let violationsFound = 0;

for (const file of clientFiles) {
  if (file.endsWith("analytics.ts")) continue;

  const fileContent = fs.readFileSync(file, "utf-8");
  const matches = fileContent.matchAll(/track(?:Event|[A-Z][a-zA-Z]+)\s*\(\s*\{([^}]*)\}\s*\)/g);
  for (const match of matches) {
    const body = match[1];
    for (const prohibited of ["latitude", "longitude", "coords", "filename", "address", "photo_bytes"]) {
      const regex = new RegExp("\\b" + prohibited + "\\s*:", "i");
      if (regex.test(body)) {
        console.error("  Violation in " + path.relative(process.cwd(), file) + ": passes prohibited " + prohibited);
        violationsFound++;
      }
    }
  }
}

assert(violationsFound === 0, "Zero prohibited PII/telemetry parameters found in client codebase (" + clientFiles.length + " files scanned)");

console.log("\n========================================");
console.log("Phase 15 Analytics Results: " + passed + " passed, " + failed + " failed");
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}