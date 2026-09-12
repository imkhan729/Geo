/**
 * Phase 17 — Tool 2: Remove GPS Automated Verification Suite
 *
 * Verifies:
 * 1. Location metadata detection
 * 2. GPS-only removal preserving camera settings
 * 3. Strip-all metadata mode
 * 4. Post-removal programmatic binary verification
 * 5. Section 29 mandatory CTAs & internal links
 * 6. Privacy invariant audit (zero server uploads)
 * 7. SEO metadata, canonical URLs, and structured data schemas
 * 8. Monetization safety & CLS geometry reservation
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { SEO_CONFIG } from "../client/src/lib/seo";
import { ADS_CONFIG } from "../client/src/lib/ads-config";
import piexif from "piexifjs";

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

// Minimal JPEG binary generator with GPS and Camera EXIF
function createSampleJpegWithGps(): string {
  const zeroth: Record<number, any> = {};
  const exif: Record<number, any> = {};
  const gps: Record<number, any> = {};

  zeroth[piexif.ImageIFD.Make] = "TestCamera";
  zeroth[piexif.ImageIFD.Model] = "Model-X";
  zeroth[piexif.ImageIFD.DateTime] = "2026:09:12 10:00:00";

  exif[piexif.ExifIFD.ExposureTime] = [1, 250];
  exif[piexif.ExifIFD.FNumber] = [28, 10];
  exif[piexif.ExifIFD.ISOSpeedRatings] = 100;
  exif[piexif.ExifIFD.DateTimeOriginal] = "2026:09:12 10:00:00";

  gps[piexif.GPSIFD.GPSLatitudeRef] = "N";
  gps[piexif.GPSIFD.GPSLatitude] = [[40, 1], [42, 1], [4600, 100]];
  gps[piexif.GPSIFD.GPSLongitudeRef] = "W";
  gps[piexif.GPSIFD.GPSLongitude] = [[74, 1], [0, 1], [2100, 100]];
  gps[piexif.GPSIFD.GPSAltitude] = [1500, 10];
  gps[piexif.GPSIFD.GPSAltitudeRef] = 0;

  const exifObj = { "0th": zeroth, Exif: exif, GPS: gps };
  const exifBytes = piexif.dump(exifObj);

  // Minimal 1x1 white JPEG base64
  const minimalJpgBase64 =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  return piexif.insert(exifBytes, minimalJpgBase64);
}

async function main() {
  console.log("\n🧪 Running Phase 17 Remove GPS Verification Suite...\n");

  console.log("Group 1: GPS Detection & Pre-Removal Inspection");
  {
    const sampleDataUrl = createSampleJpegWithGps();
    const loaded = piexif.load(sampleDataUrl);

    runTest("Accurately detects GPSLatitude in source photo", () => {
      assert.ok(loaded.GPS[piexif.GPSIFD.GPSLatitude]);
    });

    runTest("Accurately detects GPSLongitude in source photo", () => {
      assert.ok(loaded.GPS[piexif.GPSIFD.GPSLongitude]);
    });

    runTest("Accurately detects GPSAltitude in source photo", () => {
      assert.ok(loaded.GPS[piexif.GPSIFD.GPSAltitude]);
    });

    runTest("Accurately detects Camera Make in source photo", () => {
      assert.strictEqual(loaded["0th"][piexif.ImageIFD.Make], "TestCamera");
    });
  }

  console.log("\nGroup 2: Removal Modes & Truth in Advertising (Section 29)");
  {
    const sampleDataUrl = createSampleJpegWithGps();
    const loaded = piexif.load(sampleDataUrl);

    // Mode A: Remove GPS Only
    loaded.GPS = {};
    const gpsCleanBytes = piexif.dump(loaded);
    const gpsCleanDataUrl = piexif.insert(gpsCleanBytes, sampleDataUrl);
    const verifiedGpsClean = piexif.load(gpsCleanDataUrl);

    runTest("GPS-only removal wipes GPSLatitude", () => {
      assert.strictEqual(verifiedGpsClean.GPS[piexif.GPSIFD.GPSLatitude], undefined);
    });

    runTest("GPS-only removal wipes GPSLongitude", () => {
      assert.strictEqual(verifiedGpsClean.GPS[piexif.GPSIFD.GPSLongitude], undefined);
    });

    runTest("GPS-only removal wipes GPSAltitude", () => {
      assert.strictEqual(verifiedGpsClean.GPS[piexif.GPSIFD.GPSAltitude], undefined);
    });

    runTest("GPS-only removal preserves Camera Make (honest labeling)", () => {
      assert.strictEqual(verifiedGpsClean["0th"][piexif.ImageIFD.Make], "TestCamera");
    });

    runTest("GPS-only removal preserves Camera Model", () => {
      assert.strictEqual(verifiedGpsClean["0th"][piexif.ImageIFD.Model], "Model-X");
    });

    runTest("GPS-only removal preserves DateTimeOriginal", () => {
      assert.strictEqual(verifiedGpsClean.Exif[piexif.ExifIFD.DateTimeOriginal], "2026:09:12 10:00:00");
    });

    // Mode B: Strip All Metadata
    const allCleanDataUrl = piexif.remove(sampleDataUrl);
    const verifiedAllClean = piexif.load(allCleanDataUrl);

    runTest("Strip-all mode wipes GPS table completely", () => {
      assert.deepStrictEqual(verifiedAllClean.GPS, {});
    });

    runTest("Strip-all mode wipes Camera 0th table completely", () => {
      assert.deepStrictEqual(verifiedAllClean["0th"], {});
    });

    runTest("Strip-all mode wipes Exif exposure table completely", () => {
      assert.deepStrictEqual(verifiedAllClean.Exif, {});
    });
  }

  console.log("\nGroup 3: Component Architecture & Section 29 Mandatory CTAs");
  {
    const pagePath = path.resolve("client/src/pages/remove-gps-from-photo.tsx");
    runTest("client/src/pages/remove-gps-from-photo.tsx exists", () => {
      assert.ok(fs.existsSync(pagePath));
    });

    const pageContent = fs.readFileSync(pagePath, "utf8");

    runTest("Includes action link to Geotagger tool (/)", () => {
      assert.ok(pageContent.includes('href="/"'));
    });

    runTest("Includes action link to GPS Finder (/gps-finder)", () => {
      assert.ok(pageContent.includes('href="/gps-finder"'));
    });

    runTest("Includes action link to EXIF Viewer (/exif-viewer)", () => {
      assert.ok(pageContent.includes('href="/exif-viewer"'));
    });

    runTest("Includes educational link to Remove GPS tutorial", () => {
      assert.ok(pageContent.includes('href="/blog/how-to-remove-gps-data-from-photos"'));
    });

    runTest("Provides dual mode radio options (gps-only & all-metadata)", () => {
      assert.ok(pageContent.includes('value="gps-only"'));
      assert.ok(pageContent.includes('value="all-metadata"'));
    });

    runTest("Implements post-removal verification indicator badge", () => {
      assert.ok(pageContent.includes("Output Verified Clean"));
      assert.ok(pageContent.includes("0 GPS Tags"));
    });
  }

  console.log("\nGroup 4: Privacy Invariant Audit (Zero Server Uploads)");
  {
    const pagePath = path.resolve("client/src/pages/remove-gps-from-photo.tsx");
    const utilsPath = path.resolve("client/src/lib/remove-gps-utils.ts");
    const pageContent = fs.readFileSync(pagePath, "utf8");
    const utilsContent = fs.readFileSync(utilsPath, "utf8");

    runTest("Zero server upload fetch calls in remove-gps-from-photo.tsx", () => {
      assert.strictEqual(pageContent.includes("fetch("), false);
    });

    runTest("Zero server upload fetch calls in remove-gps-utils.ts", () => {
      assert.strictEqual(utilsContent.includes("fetch("), false);
    });

    runTest("Zero external POST requests in remove-gps files", () => {
      assert.strictEqual(pageContent.includes('method: "POST"'), false);
      assert.strictEqual(utilsContent.includes('method: "POST"'), false);
    });

    runTest("Revokes Object URLs to prevent browser memory leaks", () => {
      assert.ok(utilsContent.includes("URL.revokeObjectURL"));
    });
  }

  console.log("\nGroup 5: SEO Metadata & Schema Conformance");
  {
    const meta = (SEO_CONFIG as Record<string, any>).removeGps;

    runTest("SEO_CONFIG defines removeGps route", () => {
      assert.ok(meta, "SEO_CONFIG.removeGps must be defined");
    });

    runTest("Canonical URL is /remove-gps-from-photo", () => {
      assert.strictEqual(meta.canonical, "/remove-gps-from-photo");
    });

    runTest(`Title length ${meta.title.length} is within [50, 60] range`, () => {
      assert.ok(meta.title.length >= 50 && meta.title.length <= 60);
    });

    runTest(`Description length ${meta.description.length} is within [140, 160] range`, () => {
      assert.ok(meta.description.length >= 140 && meta.description.length <= 160);
    });

    const pageContent = fs.readFileSync(path.resolve("client/src/pages/remove-gps-from-photo.tsx"), "utf8");

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
  }

  console.log("\nGroup 6: Monetization Readiness & Layout Protection");
  {
    const placement = ADS_CONFIG.placements["remove-gps-below-tool"];

    runTest("remove-gps-below-tool placement is registered in ADS_CONFIG", () => {
      assert.ok(placement, "remove-gps-below-tool must exist in ADS_CONFIG.placements");
    });

    runTest("remove-gps-below-tool desktop min-height is reserved (>= 90px)", () => {
      assert.ok(placement.minHeightDesktop >= 90);
    });

    runTest("remove-gps-below-tool mobile min-height is reserved (>= 50px)", () => {
      assert.ok(placement.minHeightMobile >= 50);
    });

    const pageContent = fs.readFileSync(path.resolve("client/src/pages/remove-gps-from-photo.tsx"), "utf8");

    runTest("AdSlot is placed safely below core tool interaction zone", () => {
      const toolIdx = pageContent.indexOf("handleProcessRemoval");
      const adIdx = pageContent.indexOf('placement="remove-gps-below-tool"');
      assert.ok(toolIdx < adIdx, "AdSlot must appear after core tool interaction code");
    });
  }

  console.log("\n========================================");
  console.log(`Phase 17 Remove GPS Results: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
