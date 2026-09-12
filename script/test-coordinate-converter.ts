/**
 * Phase 17 — Tool 3: Coordinate Converter Automated Verification Suite
 *
 * Verifies:
 * 1. Mathematical conversion precision (DD <-> DMS <-> DDM <-> Geohash)
 * 2. Universal Smart Coordinate Parser (URLs, DMS, DDM, DD, Geohash)
 * 3. Distance & Bearing (Haversine formula)
 * 4. Section 30 / Phase 17 mandatory CTAs & internal links
 * 5. Privacy invariant audit (zero server uploads)
 * 6. SEO metadata, canonical URLs, and structured data schemas
 * 7. Monetization safety & CLS geometry reservation
 * 8. Accessibility landmark compliance
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { SEO_CONFIG } from "../client/src/lib/seo";
import { ADS_CONFIG } from "../client/src/lib/ads-config";
import {
  decimalToDms,
  dmsToDecimal,
  decimalToDdm,
  ddmToDecimal,
  encodeGeohash,
  decodeGeohash,
  calculateDistanceAndBearing,
  convertAllFormats,
  parseAnyCoordinates,
  isValidCoords,
} from "../client/src/lib/coordinate-converter-utils";

let passed = 0;
let failed = 0;

function runTest(description: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✓ ${description}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ✗ ${description}: ${err.message}`);
          failed++;
        });
    }
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${description}: ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log("\n🧪 Running Phase 17 Coordinate Converter Verification Suite...\n");

  // =========================================================================
  // Group 1: Mathematical Conversion Precision
  // =========================================================================
  console.log("Group 1: Mathematical Conversion Precision");

  runTest("decimalToDms correctly formats positive latitude (N)", () => {
    const dms = decimalToDms(37.774929, true);
    assert.strictEqual(dms.degrees, 37);
    assert.strictEqual(dms.minutes, 46);
    assert.strictEqual(dms.direction, "N");
    assert.strictEqual(dms.formatted.includes("37° 46'"), true);
  });

  runTest("decimalToDms correctly formats negative longitude (W)", () => {
    const dms = decimalToDms(-122.419416, false);
    assert.strictEqual(dms.degrees, 122);
    assert.strictEqual(dms.minutes, 25);
    assert.strictEqual(dms.direction, "W");
    assert.strictEqual(dms.formatted.includes("122° 25'"), true);
  });

  runTest("decimalToDms correctly formats negative latitude (S)", () => {
    const dms = decimalToDms(-33.8688, true);
    assert.strictEqual(dms.degrees, 33);
    assert.strictEqual(dms.minutes, 52);
    assert.strictEqual(dms.direction, "S");
  });

  runTest("decimalToDms correctly formats positive longitude (E)", () => {
    const dms = decimalToDms(151.2093, false);
    assert.strictEqual(dms.degrees, 151);
    assert.strictEqual(dms.minutes, 12);
    assert.strictEqual(dms.direction, "E");
  });

  runTest("dmsToDecimal accurately reconstructs decimal coordinates", () => {
    const original = 37.774929;
    const dms = decimalToDms(original, true);
    const recovered = dmsToDecimal(dms.degrees, dms.minutes, dms.seconds, dms.direction);
    assert.ok(Math.abs(original - recovered) < 0.0001, `Diff ${Math.abs(original - recovered)} too large`);
  });

  runTest("decimalToDdm correctly computes Degrees Decimal Minutes", () => {
    const ddm = decimalToDdm(37.774929, true);
    assert.strictEqual(ddm.degrees, 37);
    assert.ok(Math.abs(ddm.decimalMinutes - 46.4957) < 0.01);
    assert.strictEqual(ddm.direction, "N");
  });

  runTest("ddmToDecimal accurately reconstructs decimal coordinates", () => {
    const original = -122.419416;
    const ddm = decimalToDdm(original, false);
    const recovered = ddmToDecimal(ddm.degrees, ddm.decimalMinutes, ddm.direction);
    assert.ok(Math.abs(original - recovered) < 0.0001);
  });

  runTest("encodeGeohash generates correct base32 hashes", () => {
    // San Francisco coordinates
    const sfHash = encodeGeohash(37.774929, -122.419416, 9);
    assert.ok(sfHash.startsWith("9q8yy"), `Expected SF prefix 9q8yy, got ${sfHash}`);

    // London coordinates (51.5074, -0.1278)
    const londonHash = encodeGeohash(51.5074, -0.1278, 9);
    assert.ok(londonHash.startsWith("gcpvj"), `Expected London prefix gcpvj, got ${londonHash}`);
  });

  runTest("decodeGeohash accurately decodes center point coordinates", () => {
    const decoded = decodeGeohash("9q8yyk8y0");
    assert.ok(decoded !== null);
    assert.ok(Math.abs(decoded!.lat - 37.7749) < 0.01);
    assert.ok(Math.abs(decoded!.lng - (-122.4194)) < 0.01);
  });

  runTest("convertAllFormats outputs synchronized structures and URLs", () => {
    const res = convertAllFormats(37.774929, -122.419416, 6);
    assert.strictEqual(res.dd.formatted, "37.774929, -122.419416");
    assert.ok(res.dms.formatted.includes("37° 46'"));
    assert.ok(res.ddm.formatted.includes("37° 46."));
    assert.ok(res.urls.googleMaps.includes("37.774929"));
    assert.ok(res.urls.openStreetMap.includes("37.774929"));
    assert.ok(res.urls.appleMaps.includes("37.774929"));
  });

  runTest("isValidCoords enforces strict latitude and longitude bounds", () => {
    assert.strictEqual(isValidCoords(0, 0), true);
    assert.strictEqual(isValidCoords(90, 180), true);
    assert.strictEqual(isValidCoords(-90, -180), true);
    assert.strictEqual(isValidCoords(90.1, 0), false);
    assert.strictEqual(isValidCoords(0, 180.1), false);
    assert.strictEqual(isValidCoords(NaN, 0), false);
  });

  // =========================================================================
  // Group 2: Universal Smart Coordinate Parser
  // =========================================================================
  console.log("\nGroup 2: Universal Smart Coordinate Parser");

  runTest("Parses standard comma-separated Decimal Degrees", () => {
    const res = parseAnyCoordinates("37.774929, -122.419416");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.lat, 37.774929);
    assert.strictEqual(res.lng, -122.419416);
  });

  runTest("Parses space-separated Decimal Degrees", () => {
    const res = parseAnyCoordinates("37.774929 -122.419416");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.lat, 37.774929);
    assert.strictEqual(res.lng, -122.419416);
  });

  runTest("Parses DMS with unicode degree and minute symbols", () => {
    const res = parseAnyCoordinates('37° 46\' 29.74" N, 122° 25\' 09.90" W');
    assert.strictEqual(res.success, true);
    assert.ok(Math.abs(res.lat! - 37.774928) < 0.001);
    assert.ok(Math.abs(res.lng! - (-122.419417)) < 0.001);
  });

  runTest("Parses unspaced DMS without symbols", () => {
    const res = parseAnyCoordinates("37 46 29.74 N, 122 25 09.90 W");
    assert.strictEqual(res.success, true);
    assert.ok(Math.abs(res.lat! - 37.774928) < 0.001);
  });

  runTest("Parses DDM nautical coordinate strings", () => {
    const res = parseAnyCoordinates("37° 46.4957' N, 122° 25.1650' W");
    assert.strictEqual(res.success, true);
    assert.ok(Math.abs(res.lat! - 37.7749) < 0.001);
  });

  runTest("Parses Google Maps URL with @coordinates", () => {
    const res = parseAnyCoordinates("https://www.google.com/maps/@37.774929,-122.419416,17z");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.lat, 37.774929);
    assert.strictEqual(res.lng, -122.419416);
  });

  runTest("Parses Google Maps URL with ?q= coordinates", () => {
    const res = parseAnyCoordinates("https://maps.google.com/?q=37.774929,-122.419416");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.lat, 37.774929);
    assert.strictEqual(res.lng, -122.419416);
  });

  runTest("Parses OpenStreetMap URL with hash", () => {
    const res = parseAnyCoordinates("https://www.openstreetmap.org/#map=16/37.774929/-122.419416");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.lat, 37.774929);
    assert.strictEqual(res.lng, -122.419416);
  });

  runTest("Parses Geo URI scheme", () => {
    const res = parseAnyCoordinates("geo:37.774929,-122.419416");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.lat, 37.774929);
    assert.strictEqual(res.lng, -122.419416);
  });

  runTest("Parses raw Geohash code", () => {
    const res = parseAnyCoordinates("9q8yyk8y0");
    assert.strictEqual(res.success, true);
    assert.ok(Math.abs(res.lat! - 37.7749) < 0.01);
  });

  runTest("Rejects gibberish and returns informative error message", () => {
    const res = parseAnyCoordinates("not-a-coordinate");
    assert.strictEqual(res.success, false);
    assert.ok(typeof res.error === "string" && res.error.length > 10);
  });

  // =========================================================================
  // Group 3: Distance & Bearing Calculation
  // =========================================================================
  console.log("\nGroup 3: Distance & Bearing Calculation");

  runTest("Calculates accurate Haversine distance between SF and NY", () => {
    // SF: 37.7749, -122.4194 -> NYC: 40.7128, -74.0060
    const calc = calculateDistanceAndBearing(37.7749, -122.4194, 40.7128, -74.0060);
    // Great circle distance is approx 4,130 km
    assert.ok(calc.distanceKm > 4100 && calc.distanceKm < 4200, `Distance ${calc.distanceKm} out of expected range`);
    assert.ok(calc.distanceMiles > 2500 && calc.distanceMiles < 2650);
    assert.ok(calc.bearingDeg > 60 && calc.bearingDeg < 75, `Bearing ${calc.bearingDeg} unexpected`);
  });

  // =========================================================================
  // Group 4: Mandatory Section 30 / Phase 17 CTAs & Internal Links
  // =========================================================================
  console.log("\nGroup 4: Mandatory Section 30 / Phase 17 CTAs & Internal Links");

  const pagePath = "client/src/pages/coordinate-converter.tsx";
  runTest("client/src/pages/coordinate-converter.tsx exists", () => {
    assert.strictEqual(fs.existsSync(pagePath), true);
  });

  const pageContent = fs.readFileSync(pagePath, "utf-8");

  runTest("Includes primary conversion CTA to Geotag photo with coordinates", () => {
    assert.ok(
      pageContent.includes("cta-geotag-photo-btn") &&
      pageContent.includes("/?lat="),
      "Primary Geotag CTA button missing"
    );
  });

  runTest("Includes action link to GPS Finder (/gps-finder)", () => {
    assert.ok(pageContent.includes('href="/gps-finder"'), "GPS Finder link missing");
  });

  runTest("Includes action link to EXIF Viewer (/exif-viewer)", () => {
    assert.ok(pageContent.includes('href="/exif-viewer"'), "EXIF Viewer link missing");
  });

  runTest("Includes action link to Remove GPS (/remove-gps-from-photo)", () => {
    assert.ok(pageContent.includes('href="/remove-gps-from-photo"'), "Remove GPS link missing");
  });

  runTest("Includes action link to EXIF GPS guide (/blog/what-is-exif-gps-metadata)", () => {
    assert.ok(pageContent.includes('href="/blog/what-is-exif-gps-metadata"'), "EXIF GPS guide link missing");
  });

  // =========================================================================
  // Group 5: Privacy Invariant Audit
  // =========================================================================
  console.log("\nGroup 5: Privacy Invariant Audit");

  runTest("Zero server upload endpoints in coordinate-converter.tsx", () => {
    assert.strictEqual(pageContent.includes("/api/upload"), false);
    assert.strictEqual(pageContent.includes("FormData"), false);
  });

  runTest("Zero external POST tracking calls", () => {
    assert.strictEqual(pageContent.includes("method: 'POST'"), false);
    assert.strictEqual(pageContent.includes('method: "POST"'), false);
  });

  // =========================================================================
  // Group 6: SEO Metadata & Schema Conformance
  // =========================================================================
  console.log("\nGroup 6: SEO Metadata & Schema Conformance");

  runTest("SEO_CONFIG defines coordinateConverter route", () => {
    assert.ok(SEO_CONFIG.coordinateConverter !== undefined);
  });

  runTest("Canonical URL is /coordinate-converter", () => {
    assert.strictEqual(SEO_CONFIG.coordinateConverter.canonical, "/coordinate-converter");
  });

  runTest(`Title length ${SEO_CONFIG.coordinateConverter.title.length} is within [50, 60] range`, () => {
    const len = SEO_CONFIG.coordinateConverter.title.length;
    assert.ok(len >= 50 && len <= 60, `Title length ${len} outside [50, 60]`);
  });

  runTest(`Description length ${SEO_CONFIG.coordinateConverter.description.length} is within [140, 160] range`, () => {
    const len = SEO_CONFIG.coordinateConverter.description.length;
    assert.ok(len >= 140 && len <= 160, `Description length ${len} outside [140, 160]`);
  });

  runTest("Declares WebPage JSON-LD schema", () => {
    assert.ok(pageContent.includes('"@type": "WebPage"'));
  });

  runTest("Declares BreadcrumbList JSON-LD schema", () => {
    assert.ok(pageContent.includes('"@type": "BreadcrumbList"'));
  });

  runTest("Declares WebApplication JSON-LD schema", () => {
    assert.ok(pageContent.includes('"@type": "WebApplication"'));
  });

  runTest("Declares FAQPage JSON-LD schema", () => {
    assert.ok(pageContent.includes('"@type": "FAQPage"'));
  });

  // =========================================================================
  // Group 7: Monetization Readiness & Layout Protection
  // =========================================================================
  console.log("\nGroup 7: Monetization Readiness & Layout Protection");

  runTest("coordinate-converter-below-tool placement is registered in ADS_CONFIG", () => {
    assert.ok(ADS_CONFIG.placements["coordinate-converter-below-tool"] !== undefined);
  });

  runTest("coordinate-converter-below-tool desktop min-height is reserved (>= 90px)", () => {
    const placement = ADS_CONFIG.placements["coordinate-converter-below-tool"];
    assert.ok(placement.minHeightDesktop >= 90);
  });

  runTest("AdSlot is placed safely below core tool cards", () => {
    assert.ok(pageContent.includes('<AdSlot placement="coordinate-converter-below-tool" />'));
  });

  // =========================================================================
  // Group 8: Accessibility Landmark Compliance
  // =========================================================================
  console.log("\nGroup 8: Accessibility Landmark Compliance");

  runTest("Contains <main id='main-content' tabIndex={-1}> landmark", () => {
    assert.ok(
      pageContent.includes('id="main-content"') && pageContent.includes("tabIndex={-1}"),
      "Main accessible landmark missing"
    );
  });

  runTest("Page contains exactly one primary <h1> heading", () => {
    const h1Matches = pageContent.match(/<h1[\s\S]*?<\/h1>/g);
    assert.ok(h1Matches && h1Matches.length === 1, `Expected 1 h1 tag, found ${h1Matches?.length}`);
  });

  console.log("\n========================================");
  console.log(`Phase 17 Coordinate Converter Results: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
