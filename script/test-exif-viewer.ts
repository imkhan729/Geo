/**
 * Automated Test Suite: Phase 17 — EXIF Viewer Tool Expansion (Section 28)
 *
 * Verifies:
 * 1. Metadata engine grouping strictly conforms to Section 28 (camera, date/time, orientation, dimensions, GPS, software, copyright)
 * 2. Graceful fallback on empty or stripped metadata
 * 3. Formatter utilities (DMS, Megapixels, Aspect Ratio, Bytes)
 * 4. Plain-text and JSON summary export utilities
 * 5. Mandatory Section 28 CTAs (Add GPS, GPS Finder, Remove GPS) in UI
 * 6. Zero-upload client-side privacy architecture
 * 7. SERP metadata compliance (title 50-60, desc 140-160, canonical URL)
 * 8. Safe ad slot layout protection
 */

import fs from "fs";
import path from "path";
import {
  extractExifData,
  formatDms,
  formatCoordinates,
  formatCoordinatesDecimal,
  calculateAspectRatio,
  calculateMegapixels,
  formatBytes,
  generateMetadataSummary,
  ExifData
} from "../client/src/lib/exif-utils";
import { SEO_CONFIG } from "../client/src/lib/seo";
import { ADS_CONFIG } from "../client/src/lib/ads-config";

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

console.log("\n🧪 Running Phase 17 EXIF Viewer Verification Suite...\n");

async function runTests() {
  // ── Test Group 1: Metadata Engine Grouping (Section 28) ──
  console.log("Group 1: Section 28 Grouped Schema & Formatters");

  // Formatters
  assert(formatDms(40.7128, true) === "40° 42' 46.1\" N", "formatDms produces accurate positive latitude DMS");
  assert(formatDms(-74.006, false) === "74° 0' 21.6\" W", "formatDms produces accurate negative longitude DMS");
  assert(formatCoordinates(40.7128, -74.006) === "40° 42' 46.1\" N, 74° 0' 21.6\" W", "formatCoordinates produces standard combined DMS string");
  assert(formatCoordinatesDecimal(40.7128, -74.006) === "40.712800, -74.006000", "formatCoordinatesDecimal produces 6-decimal fixed coordinates");
  assert(calculateMegapixels(4000, 3000) === "12.0 MP", "calculateMegapixels computes accurate megapixel count");
  assert(calculateAspectRatio(4000, 3000) === "4:3", "calculateAspectRatio detects standard 4:3 camera ratio");
  assert(calculateAspectRatio(1920, 1080) === "16:9", "calculateAspectRatio detects standard 16:9 widescreen ratio");
  assert(formatBytes(2048576) === "2.0 MB", "formatBytes produces human-readable file size");

  // ── Test Group 2: Empty EXIF & Graceful Fallback ──
  console.log("\nGroup 2: Empty Buffer & Graceful Fallback");
  // Minimal valid 1x1 JPEG without EXIF headers
  const minimalJpeg = Buffer.from([
    0xff, 0xd8, // SOI
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // JFIF
    0xff, 0xdb, 0x00, 0x43, 0x00, // DQT
    ...new Array(64).fill(1),
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, // SOF0
    0xff, 0xc4, 0x00, 0x1f, 0x00, // DHT
    0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ...new Array(12).fill(0),
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // SOS
    0x7f,
    0xff, 0xd9 // EOI
  ]);

  const emptyResult = await extractExifData(minimalJpeg.buffer as ArrayBuffer, "empty.jpg", minimalJpeg.length);
  assert(emptyResult.success === true, "extractExifData returns success: true on valid image without EXIF");
  assert(emptyResult.hasExif === false, "Correctly flags hasExif: false when no camera tags present");
  assert(emptyResult.hasGps === false, "Correctly flags hasGps: false when no GPS tags present");
  assert(emptyResult.data !== null, "Returns non-null default data structure");
  assert(emptyResult.data?.gps.latitude === null, "GPS latitude defaults cleanly to null");
  assert(emptyResult.data?.camera.make === null, "Camera make defaults cleanly to null");

  // ── Test Group 3: Metadata Summary Export ──
  console.log("\nGroup 3: Summary Export Generation");
  const mockExifData: ExifData = {
    dateTime: "2026:09:12 10:30:00",
    image: { width: 4032, height: 3024, orientation: "Horizontal (Normal)" },
    software: "iOS 18.0",
    exposureTime: "1/120",
    fNumber: "1.8",
    iso: 64,
    focalLength: "6.86 mm",
    flash: "Off, Did not fire",
    camera: {
      make: "Apple",
      model: "iPhone 16 Pro",
      lensModel: "iPhone 16 Pro back triple camera 6.86mm f/1.78",
      focalLength: "6.86 mm",
      focalLength35mm: "24 mm",
      fNumber: "f/1.8",
      exposureTime: "1/120 sec",
      iso: 64,
      exposureProgram: "Normal program",
      meteringMode: "Pattern",
      flash: "Off, Did not fire",
      whiteBalance: "Auto",
    },
    dateTimeInfo: {
      original: "2026:09:12 10:30:00",
      digitized: "2026:09:12 10:30:00",
      modified: "2026:09:12 10:30:00",
      offsetTime: "+03:00",
    },
    geometry: {
      width: 4032,
      height: 3024,
      megapixels: "12.2 MP",
      aspectRatio: "4:3",
      orientation: "Horizontal (Normal)",
      orientationCode: 1,
    },
    gps: {
      latitude: 40.7128,
      longitude: -74.006,
      altitude: 15.4,
      altitudeRef: "Above sea level",
      dmsFormatted: "40° 42' 46.1\" N, 74° 0' 21.6\" W",
      decimalFormatted: "40.712800, -74.006000",
      dateStamp: "2026:09:12",
      timeStamp: "07:30:00",
      imgDirection: 180,
      googleMapsUrl: "https://www.google.com/maps?q=40.712800,-74.006000",
      osmUrl: "https://www.openstreetmap.org/?mlat=40.712800&mlon=-74.006000#map=16/40.712800/-74.006000",
    },
    softwareInfo: {
      software: "18.0",
      colorSpace: "sRGB",
      bitsPerSample: "8, 8, 8",
      fileType: "JPEG",
      fileSizeFormatted: "3.4 MB",
    },
    copyright: {
      artist: "Photographer Name",
      copyright: "Copyright 2026",
      imageDescription: "Scenic View",
      userComment: null,
    },
    totalTagsCount: 42,
  };

  const summary = generateMetadataSummary(mockExifData, "sample.jpg");
  assert(summary.includes("Camera Make:       Apple"), "Summary contains Camera Make");
  assert(summary.includes("Camera Model:      iPhone 16 Pro"), "Summary contains Camera Model");
  assert(summary.includes("Aperture:          f/1.8"), "Summary contains Aperture");
  assert(summary.includes("ISO:               64"), "Summary contains ISO");
  assert(summary.includes("Latitude:          40.712800°"), "Summary contains Latitude");
  assert(summary.includes("Google Maps:       https://www.google.com/maps?q=40.712800,-74.006000"), "Summary contains Google Maps link");

  // ── Test Group 4: Section 28 Required CTAs in Page Source ──
  console.log("\nGroup 4: Mandatory Section 28 CTAs & Internal Links");
  const pagePath = path.resolve(process.cwd(), "client/src/pages/exif-viewer.tsx");
  assert(fs.existsSync(pagePath), "client/src/pages/exif-viewer.tsx exists");
  const pageSource = fs.readFileSync(pagePath, "utf8");

  assert(pageSource.includes('href="/"'), "Includes action link to Geotagger tool (/)");
  assert(pageSource.includes('href="/gps-finder"'), "Includes action link to GPS Finder (/gps-finder)");
  assert(pageSource.includes('href="/blog/how-to-remove-gps-data-from-photos"'), "Includes action link to Remove GPS guide");
  assert(pageSource.includes('handleExportJson'), "Provides Export JSON functionality");
  assert(pageSource.includes('handleCopySummary'), "Provides Copy Summary functionality");
  assert(pageSource.includes('showRawTags'), "Provides searchable Raw EXIF tags view");

  // ── Test Group 5: Zero-Upload Client-Side Privacy ──
  console.log("\nGroup 5: Privacy Invariant Audit");
  assert(!pageSource.includes('fetch("/api/upload"'), "Zero server upload calls in exif-viewer.tsx");
  assert(!pageSource.includes('axios.post'), "Zero external POST requests");
  assert(pageSource.includes('extractExifData'), "Uses local client-side extraction utility");
  assert(pageSource.includes('cleanupPreview'), "Implements memory cleanup for object URLs");

  // ── Test Group 6: SEO Metadata & Schema ──
  console.log("\nGroup 6: SEO Metadata & Schema Conformance");
  assert(SEO_CONFIG.exifViewer !== undefined, "SEO_CONFIG defines exifViewer route");
  assert(SEO_CONFIG.exifViewer.canonical === "/exif-viewer", "Canonical URL is /exif-viewer");
  assert(
    SEO_CONFIG.exifViewer.title.length >= 50 && SEO_CONFIG.exifViewer.title.length <= 60,
    `Title length ${SEO_CONFIG.exifViewer.title.length} is within [50, 60] range`
  );
  assert(
    SEO_CONFIG.exifViewer.description.length >= 140 && SEO_CONFIG.exifViewer.description.length <= 160,
    `Description length ${SEO_CONFIG.exifViewer.description.length} is within [140, 160] range`
  );
  assert(pageSource.includes('"@type": "WebPage"'), "Declares WebPage JSON-LD schema");
  assert(pageSource.includes('"@type": "BreadcrumbList"'), "Declares BreadcrumbList JSON-LD schema");
  assert(pageSource.includes('"@type": "WebApplication"'), "Declares WebApplication JSON-LD schema");
  assert(pageSource.includes('"@type": "FAQPage"'), "Declares FAQPage JSON-LD schema");

  // ── Test Group 7: Monetization & Ad Placement Safety ──
  console.log("\nGroup 7: Monetization Readiness & Layout Protection");
  assert(
    ADS_CONFIG.placements["exif-viewer-below-tool"] !== undefined,
    "exif-viewer-below-tool placement is registered in ADS_CONFIG"
  );
  assert(
    ADS_CONFIG.placements["exif-viewer-below-tool"].minHeightDesktop >= 90,
    "exif-viewer-below-tool desktop min-height is reserved (>= 90px)"
  );
  assert(
    pageSource.includes('placement="exif-viewer-below-tool"'),
    "AdSlot is placed safely below core tool interaction zone"
  );

  console.log("\n========================================");
  console.log(`Phase 17 EXIF Viewer Results: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
