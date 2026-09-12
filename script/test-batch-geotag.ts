/**
 * Phase 17 Improved Batch Workflow Verification Suite
 * Verifies CSV parsing, filename matching, export formatting, CTAs, schemas,
 * privacy invariants, accessibility landmarks, and ad layout safety.
 */

import fs from "fs";
import path from "path";
import {
  parseCoordinateCsv,
  detectDelimiter,
  matchCsvToImages,
  generateBatchExportCsv,
  formatBatchFilename,
} from "../client/src/lib/batch-workflow-utils";
import { SEO_CONFIG } from "../client/src/lib/seo";
import { ADS_CONFIG } from "../client/src/lib/ads-config";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n🧪 Running Phase 17 Improved Batch Workflow Verification Suite...\n");

// ── Group 1: CSV Coordinate Parsing & Delimiter Detection ───────────
console.log("Group 1: CSV Parsing Precision & Delimiter Detection");

assert(detectDelimiter("filename,latitude,longitude") === ",", "Detects comma delimiter");
assert(detectDelimiter("filename;latitude;longitude") === ";", "Detects semicolon delimiter");
assert(detectDelimiter("filename\tlatitude\tlongitude") === "\t", "Detects tab delimiter");

const validCsv = `filename,lat,lng,alt,description
IMG_001.jpg,37.774929,-122.419416,15.5,"San Francisco Bay"
IMG_002.png,40.712776,-74.005974,,New York City
IMG_003.webp,-33.868820,151.209296,58,"Sydney Opera House"`;

const parsed = parseCoordinateCsv(validCsv);
assert(parsed.validCount === 3, "Parses 3 valid rows from standard CSV");
assert(parsed.rows[0].filename === "IMG_001.jpg", "Row 1 filename correctly parsed");
assert(Math.abs(parsed.rows[0].latitude - 37.774929) < 0.000001, "Row 1 latitude parsed accurately");
assert(Math.abs(parsed.rows[0].longitude - (-122.419416)) < 0.000001, "Row 1 longitude parsed accurately");
assert(parsed.rows[0].altitude === 15.5, "Row 1 altitude parsed correctly");
assert(parsed.rows[0].description === "San Francisco Bay", "Row 1 quoted description preserved");
assert(parsed.rows[1].altitude === undefined, "Row 2 empty altitude gracefully undefined");

// Boundary testing
const invalidCsv = `filename,latitude,longitude
PHOTO_OK.jpg,0,0
PHOTO_BAD_LAT.jpg,95.123,50.000
PHOTO_BAD_LNG.jpg,20.000,185.000
PHOTO_TEXT.jpg,abc,def`;

const invalidResult = parseCoordinateCsv(invalidCsv);
assert(invalidResult.validCount === 1, "Only valid rows accepted from mixed CSV");
assert(invalidResult.errors.length === 3, "Reports 3 specific row errors");

// Missing header check
const missingHeaderCsv = `some_name,some_val\nfoo,123`;
const missingResult = parseCoordinateCsv(missingHeaderCsv);
assert(missingResult.validCount === 0 && missingResult.errors.length > 0, "Rejects CSV missing required coordinate headers");


// ── Group 2: Filename Matching Logic ────────────────────────────────
console.log("\nGroup 2: Filename Matching & Association");

const dummyImages = [
  { name: "DSC_0001.JPG" },
  { name: "IMG_site_front.png" },
  { name: "aerial-view.webp" },
  { name: "unmatched-photo.jpg" },
];

const matchCsv = [
  { filename: "DSC_0001.JPG", latitude: 34.05, longitude: -118.25 }, // exact
  { filename: "img_site_front.png", latitude: 34.06, longitude: -118.26 }, // case-insensitive
  { filename: "aerial-view", latitude: 34.07, longitude: -118.27 }, // extension-agnostic
];

const matches = matchCsvToImages(matchCsv, dummyImages);
assert(matches.size === 3, "Matches all 3 candidates across exact, case-insensitive, and extension-agnostic criteria");
assert(matches.get(dummyImages[0])?.latitude === 34.05, "Exact match coordinate assigned");
assert(matches.get(dummyImages[1])?.latitude === 34.06, "Case-insensitive match coordinate assigned");
assert(matches.get(dummyImages[2])?.latitude === 34.07, "Extension-agnostic match coordinate assigned");


// ── Group 3: Export CSV & Renaming Pattern Formatter ────────────────
console.log("\nGroup 3: Export Formatting & Batch Renaming");

const exportItems = [
  {
    filename: "Site_A.jpg",
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 12.3,
    description: 'Front entrance, "Gate 1"',
    status: "success",
    verificationStatus: "Verified",
  },
];

const generatedCsv = generateBatchExportCsv(exportItems);
assert(generatedCsv.includes("Filename,Latitude,Longitude,Altitude"), "Generated CSV contains standard headers");
assert(generatedCsv.includes('"Site_A.jpg"'), "Filename quoted properly");
assert(generatedCsv.includes('"Front entrance, ""Gate 1"""'), "Quoted description with inner quotes escaped properly");

const renamed1 = formatBatchFilename("photo1.jpg", "{name}_geo", 1);
assert(renamed1 === "photo1_geo.jpg", "Formats custom suffix filename pattern");

const renamed2 = formatBatchFilename("photo2.png", "{index}_{name}_{lat}_{lng}", 2, 37.7749, -122.4194);
assert(renamed2 === "2_photo2_37.7749_-122.4194.png", "Formats complex tokenized filename pattern");


// ── Group 4: Mandatory Section 31 / Phase 17 CTAs & Cross-Links ─────
console.log("\nGroup 4: Mandatory Phase 17 CTAs & Internal Links");

const pagePath = "client/src/pages/batch-geotag-photos.tsx";
assert(fs.existsSync(pagePath), "client/src/pages/batch-geotag-photos.tsx exists");

const pageSource = fs.readFileSync(pagePath, "utf8");

assert(pageSource.includes('href="/"'), "Includes action link to Single Photo Geotagger (/)");
assert(pageSource.includes('href="/gps-finder"'), "Includes action link to GPS Finder (/gps-finder)");
assert(pageSource.includes('href="/exif-viewer"'), "Includes action link to EXIF Viewer (/exif-viewer)");
assert(pageSource.includes('href="/remove-gps-from-photo"'), "Includes action link to Remove GPS (/remove-gps-from-photo)");
assert(pageSource.includes('href="/coordinate-converter"'), "Includes action link to Coordinate Converter (/coordinate-converter)");
assert(pageSource.includes("/blog/how-to-bulk-geotag-photos"), "Includes action link to Bulk Geotagging Guide");


// ── Group 5: Privacy Invariant Audit ────────────────────────────────
console.log("\nGroup 5: Privacy Invariant Audit");

assert(!pageSource.includes("fetch('/api/upload'"), "Zero server upload endpoints in batch-geotag-photos.tsx");
assert(!pageSource.includes('method: "POST"'), "Zero external POST tracking calls");


// ── Group 6: SEO Metadata & Schema Conformance ───────────────────────
console.log("\nGroup 6: SEO Metadata & Schema Conformance");

const seo = (SEO_CONFIG as any).batchGeotag;
assert(!!seo, "SEO_CONFIG defines batchGeotag route");
assert(seo?.canonical === "/batch-geotag-photos", "Canonical URL is /batch-geotag-photos");
assert(
  seo?.title.length >= 50 && seo?.title.length <= 60,
  `Title length ${seo?.title.length} is within [50, 60] range`
);
assert(
  seo?.description.length >= 140 && seo?.description.length <= 160,
  `Description length ${seo?.description.length} is within [140, 160] range`
);

assert(pageSource.includes('"@type": "WebPage"'), "Declares WebPage JSON-LD schema");
assert(pageSource.includes('"@type": "BreadcrumbList"'), "Declares BreadcrumbList JSON-LD schema");
assert(pageSource.includes('"@type": "WebApplication"'), "Declares WebApplication JSON-LD schema");
assert(pageSource.includes('"@type": "FAQPage"'), "Declares FAQPage JSON-LD schema");


// ── Group 7: Monetization Readiness & Layout Protection ─────────────
console.log("\nGroup 7: Monetization Readiness & Layout Protection");

const adPlacement = (ADS_CONFIG.placements as any)["batch-geotag-below-tool"];
assert(!!adPlacement, "batch-geotag-below-tool placement is registered in ADS_CONFIG");
assert(adPlacement?.minHeightDesktop >= 90, "batch-geotag-below-tool desktop min-height is reserved (>= 90px)");
assert(pageSource.includes('placement="batch-geotag-below-tool"'), "AdSlot is placed safely below core tool cards");


// ── Group 8: Accessibility Landmark Compliance ──────────────────────
console.log("\nGroup 8: Accessibility Landmark Compliance");

assert(
  pageSource.includes('<main id="main-content" tabIndex={-1}'),
  "Contains <main id='main-content' tabIndex={-1}> landmark"
);
const h1Matches = pageSource.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
assert(h1Matches !== null && h1Matches.length === 1, "Page contains exactly one primary <h1> heading");


// ── Summary ─────────────────────────────────────────────────────────
console.log("\n========================================");
console.log(`Phase 17 Batch Geotag Results: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}
