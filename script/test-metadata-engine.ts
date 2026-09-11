import {
  degToDmsRational,
  decimalToDms,
  dmsToDecimal,
  calculateDistanceMeters,
  verifyGeotaggedBlob,
  addGeotagToImage,
  addGeotagAndVerify,
  GeotagData,
} from "../client/src/lib/geotag-utils";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] Assertion failed: ${message}`);
  }
}

// Minimal valid 1x1 base64 images
// 1x1 blank JPEG
const MINIMAL_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

// 1x1 blank PNG
const MINIMAL_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// 1x1 blank WebP
const MINIMAL_WEBP_B64 =
  "UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAgA0JaQAA3AA/vv32v//4AAAAA==";

function b64ToBlob(b64: string, mime: string): Blob {
  const binaryStr = Buffer.from(b64, "base64");
  return new Blob([binaryStr], { type: mime });
}

function b64ToFile(b64: string, filename: string, mime: string): File {
  const binaryStr = Buffer.from(b64, "base64");
  return new File([binaryStr], filename, { type: mime });
}

async function runMetadataTestSuite() {
  console.log("==================================================");
  console.log("STARTING PHASE 5 METADATA ENGINE & VERIFICATION SUITE");
  console.log("==================================================");

  // 1. Distance formula test
  console.log("\n[Test 1] Geodesic Distance Formula (Haversine)...");
  const distZero = calculateDistanceMeters(40.7128, -74.006, 40.7128, -74.006);
  assert(distZero === 0, `Same coords should have 0 distance, got ${distZero}`);

  // 1 degree latitude is approximately 111,139 meters
  const dist1DegLat = calculateDistanceMeters(0, 0, 1, 0);
  assert(
    dist1DegLat > 110000 && dist1DegLat < 112000,
    `1 degree latitude should be ~111km, got ${dist1DegLat}`
  );
  console.log(`✓ Geodesic distance verified (0m = ${distZero}, 1° lat = ${dist1DegLat}m)`);

  // 2. Coordinate normalization & edge cases
  console.log("\n[Test 2] DMS Boundary Over-Rounding Normalization...");
  // Test lat close to 60 seconds (e.g. 40 + 59/60 + 59.999/3600)
  const boundaryVal = 40.999999;
  const dmsResult = decimalToDms(boundaryVal, true);
  assert(dmsResult.seconds < 60, `Seconds must be < 60, got ${dmsResult.seconds}`);
  assert(dmsResult.minutes < 60, `Minutes must be < 60, got ${dmsResult.minutes}`);
  assert(dmsResult.degrees === 41 || dmsResult.degrees === 40, "Degrees should be valid");
  console.log(`✓ Boundary normalization passed: ${boundaryVal}° -> ${dmsResult.formatted}`);

  // 3. JPEG Geotagging and Verification Loop
  console.log("\n[Test 3] JPEG Geotagging & Binary Verification Loop...");
  const jpegFile = b64ToFile(MINIMAL_JPEG_B64, "test-photo.jpg", "image/jpeg");
  const nycGeotag: GeotagData = {
    latitude: 40.7128,
    longitude: -74.006,
    altitude: 12.5,
    keywords: "new york, city, skyline",
    description: "NYC test photo",
  };

  const jpegResult = await addGeotagAndVerify(jpegFile, nycGeotag);
  console.log("JPEG Verification Result:", {
    format: jpegResult.verification.format,
    isValid: jpegResult.verification.isValid,
    coordinatesVerified: jpegResult.verification.coordinatesVerified,
    diffMeters: jpegResult.verification.diffMeters,
    altitudeVerified: jpegResult.verification.altitudeVerified,
    extracted: jpegResult.verification.extractedGps,
  });

  assert(jpegResult.verification.format === "jpeg", "Format should be jpeg");
  assert(jpegResult.verification.isValid, "JPEG verification should pass");
  assert(jpegResult.verification.coordinatesVerified, "JPEG coordinates should be verified");
  assert(jpegResult.verification.diffMeters < 1.0, `JPEG coords diff should be < 1m, got ${jpegResult.verification.diffMeters}m`);
  assert(jpegResult.verification.altitudeVerified === true, "JPEG altitude should be verified");
  console.log("✓ JPEG geotagging and verification loop passed flawlessly!");

  // 4. PNG Geotagging and Verification Loop
  console.log("\n[Test 4] PNG Geotagging & Binary Verification Loop (eXIf Chunk + CRC32)...");
  const pngFile = b64ToFile(MINIMAL_PNG_B64, "test-graphic.png", "image/png");
  const sydneyGeotag: GeotagData = {
    latitude: -33.8688, // Southern hemisphere
    longitude: 151.2093, // Eastern hemisphere
    altitude: 58.0,
    keywords: "sydney, harbour, opera house",
    description: "Sydney Australia test",
  };

  const pngResult = await addGeotagAndVerify(pngFile, sydneyGeotag);
  console.log("PNG Verification Result:", {
    format: pngResult.verification.format,
    isValid: pngResult.verification.isValid,
    coordinatesVerified: pngResult.verification.coordinatesVerified,
    diffMeters: pngResult.verification.diffMeters,
    altitudeVerified: pngResult.verification.altitudeVerified,
    crcValid: pngResult.verification.details?.crcValid,
    extracted: pngResult.verification.extractedGps,
  });

  assert(pngResult.verification.format === "png", "Format should be png");
  assert(pngResult.verification.isValid, "PNG verification should pass");
  assert(pngResult.verification.coordinatesVerified, "PNG coordinates should be verified");
  assert(pngResult.verification.details?.crcValid === true, "PNG eXIf chunk CRC32 must be valid");
  assert(pngResult.verification.diffMeters < 1.0, `PNG coords diff should be < 1m, got ${pngResult.verification.diffMeters}m`);
  console.log("✓ PNG geotagging, eXIf insertion, and CRC32 verification passed!");

  // 5. WebP Geotagging and Verification Loop
  console.log("\n[Test 5] WebP Geotagging & Binary Verification Loop (VP8X + EXIF Chunk)...");
  const webpFile = b64ToFile(MINIMAL_WEBP_B64, "test-image.webp", "image/webp");
  const tokyoGeotag: GeotagData = {
    latitude: 35.6762,
    longitude: 139.6503,
    altitude: 40.0,
    keywords: "tokyo, shibuya, japan",
    description: "Tokyo photo",
  };

  const webpResult = await addGeotagAndVerify(webpFile, tokyoGeotag);
  console.log("WebP Verification Result:", {
    format: webpResult.verification.format,
    isValid: webpResult.verification.isValid,
    coordinatesVerified: webpResult.verification.coordinatesVerified,
    diffMeters: webpResult.verification.diffMeters,
    extracted: webpResult.verification.extractedGps,
  });

  assert(webpResult.verification.format === "webp", "Format should be webp");
  assert(webpResult.verification.isValid, "WebP verification should pass");
  assert(webpResult.verification.coordinatesVerified, "WebP coordinates should be verified");
  assert(webpResult.verification.diffMeters < 1.0, `WebP coords diff should be < 1m, got ${webpResult.verification.diffMeters}m`);
  console.log("✓ WebP geotagging, VP8X container update, and verification passed!");

  // 6. Hemisphere Edge Cases: Equator and Prime Meridian (0, 0)
  console.log("\n[Test 6] Hemisphere Edge Case: Prime Meridian & Equator (0.0, 0.0)...");
  const equatorGeotag: GeotagData = {
    latitude: 0.0,
    longitude: 0.0,
  };
  const zeroResult = await addGeotagAndVerify(jpegFile, equatorGeotag);
  assert(zeroResult.verification.isValid, "Equator verification should pass");
  assert(zeroResult.verification.coordinatesVerified, "Equator coords verified");
  assert(
    zeroResult.verification.extractedGps?.lat === 0 && zeroResult.verification.extractedGps?.lng === 0,
    "Extracted lat/lng must both be 0"
  );
  console.log("✓ Prime Meridian and Equator (0.0, 0.0) verified!");

  // 7. Southern & Western Hemisphere (Both negative: Buenos Aires)
  console.log("\n[Test 7] Southern + Western Hemisphere (Buenos Aires: -34.6037, -58.3816)...");
  const baGeotag: GeotagData = {
    latitude: -34.6037,
    longitude: -58.3816,
  };
  const baResult = await addGeotagAndVerify(jpegFile, baGeotag);
  assert(baResult.verification.isValid, "Buenos Aires verification should pass");
  assert(baResult.verification.coordinatesVerified, "Buenos Aires coordinates verified");
  assert(baResult.verification.extractedGps!.lat < 0, "Lat must be negative (S)");
  assert(baResult.verification.extractedGps!.lng < 0, "Lng must be negative (W)");
  console.log(`✓ Both negative coordinates preserved: ${baResult.verification.extractedGps?.lat}, ${baResult.verification.extractedGps?.lng}`);

  // 8. Corrupted / Mismatched Verification Detection Test
  console.log("\n[Test 8] Verification Guardrails: Catching Coordinate Mismatches...");
  // Verify the NYC image against Tokyo coordinates — must fail verification!
  const mismatchVerification = await verifyGeotaggedBlob(jpegResult.blob, tokyoGeotag);
  console.log("Mismatch check result (expected to fail):", {
    isValid: mismatchVerification.isValid,
    coordinatesVerified: mismatchVerification.coordinatesVerified,
    diffMeters: mismatchVerification.diffMeters,
  });
  assert(!mismatchVerification.isValid, "Mismatch verification must fail isValid");
  assert(!mismatchVerification.coordinatesVerified, "Mismatch verification must fail coordinatesVerified");
  assert(mismatchVerification.diffMeters > 1000000, "Distance between NYC and Tokyo must be > 1000km");
  console.log("✓ Verification engine successfully caught coordinate discrepancy!");

  console.log("\n==================================================");
  console.log("ALL PHASE 5 METADATA VERIFICATION TESTS PASSED (8/8)!");
  console.log("==================================================");
}

runMetadataTestSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
