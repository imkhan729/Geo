import {
  extractPhotoMetadata,
  addGeotagToImage,
  readFileAsDataUrl,
  decimalToDms,
  dmsToDecimal,
  GeotagData
} from "../client/src/lib/geotag-utils";
import piexif from "piexifjs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] Assertion failed: ${message}`);
  }
}

// 1x1 blank base64 images
const MINIMAL_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

const MINIMAL_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MINIMAL_WEBP_B64 =
  "UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAgA0JaQAA3AA/vv32v//4AAAAA==";

function b64ToFile(b64: string, filename: string, mime: string): File {
  const binaryStr = Buffer.from(b64, "base64");
  return new File([binaryStr], filename, { type: mime });
}

async function runGpsFinderTests() {
  console.log("==================================================");
  console.log("STARTING PHASE 6 GPS FINDER AUTOMATED TEST SUITE");
  console.log("==================================================");

  // Test 1: Image WITH GPS (JPEG)
  console.log("\n[Test 1] Extracting GPS from JPEG with embedded coordinates...");
  const jpegFile = b64ToFile(MINIMAL_JPEG_B64, "test-nyc.jpg", "image/jpeg");
  const nycGeotag: GeotagData = {
    latitude: 40.7128,
    longitude: -74.006,
    altitude: 12.5,
    description: "NYC View",
  };
  const taggedJpegBlob = await addGeotagToImage(jpegFile, nycGeotag);
  const jpegDataUrl = await readFileAsDataUrl(new File([taggedJpegBlob], "tagged.jpg", { type: "image/jpeg" }));
  const jpegMeta = await extractPhotoMetadata(jpegDataUrl);

  assert(jpegMeta.hasGps === true, "JPEG must have hasGps === true");
  assert(jpegMeta.gps !== null, "JPEG gps object must not be null");
  assert(Math.abs(jpegMeta.gps!.lat - 40.7128) < 0.0001, "Latitude must match 40.7128");
  assert(Math.abs(jpegMeta.gps!.lng - (-74.006)) < 0.0001, "Longitude must match -74.006");
  assert(jpegMeta.gps!.altitudeMeters === 12.5, `Altitude meters must be 12.5, got ${jpegMeta.gps!.altitudeMeters}`);
  assert(jpegMeta.gps!.altitudeFeet === 41, `Altitude feet must be 41, got ${jpegMeta.gps!.altitudeFeet}`);
  assert(jpegMeta.gps!.dmsLat.direction === "N", "Latitude direction must be N");
  assert(jpegMeta.gps!.dmsLng.direction === "W", "Longitude direction must be W");
  assert(typeof jpegMeta.gps!.dmsFormatted === "string" && jpegMeta.gps!.dmsFormatted.includes("N"), "dmsFormatted must include N");
  console.log("✓ Extracted JPEG GPS:", {
    lat: jpegMeta.gps!.lat,
    lng: jpegMeta.gps!.lng,
    dms: jpegMeta.gps!.dmsFormatted,
    altitude: `${jpegMeta.gps!.altitudeMeters}m (${jpegMeta.gps!.altitudeFeet}ft)`,
    dateStamp: jpegMeta.gps!.dateStamp,
  });

  // Test 2: Image WITH GPS (PNG eXIf chunk)
  console.log("\n[Test 2] Extracting GPS from PNG with eXIf chunk (Southern Hemisphere)...");
  const pngFile = b64ToFile(MINIMAL_PNG_B64, "sydney.png", "image/png");
  const sydneyGeotag: GeotagData = {
    latitude: -33.8688,
    longitude: 151.2093,
    altitude: 58.0,
  };
  const taggedPngBlob = await addGeotagToImage(pngFile, sydneyGeotag);
  const pngDataUrl = await readFileAsDataUrl(new File([taggedPngBlob], "tagged.png", { type: "image/png" }));
  const pngMeta = await extractPhotoMetadata(pngDataUrl);

  assert(pngMeta.hasGps === true, "PNG must have hasGps === true");
  assert(pngMeta.gps !== null, "PNG gps object must not be null");
  assert(Math.abs(pngMeta.gps!.lat - (-33.8688)) < 0.0001, "PNG lat must match -33.8688");
  assert(Math.abs(pngMeta.gps!.lng - 151.2093) < 0.0001, "PNG lng must match 151.2093");
  assert(pngMeta.gps!.dmsLat.direction === "S", "PNG lat direction must be S");
  assert(pngMeta.gps!.dmsLng.direction === "E", "PNG lng direction must be E");
  console.log("✓ Extracted PNG GPS:", {
    lat: pngMeta.gps!.lat,
    lng: pngMeta.gps!.lng,
    dms: pngMeta.gps!.dmsFormatted,
  });

  // Test 3: Image WITH GPS (WebP EXIF chunk)
  console.log("\n[Test 3] Extracting GPS from WebP with EXIF chunk...");
  const webpFile = b64ToFile(MINIMAL_WEBP_B64, "tokyo.webp", "image/webp");
  const tokyoGeotag: GeotagData = {
    latitude: 35.6762,
    longitude: 139.6503,
    altitude: 40.0,
  };
  const taggedWebpBlob = await addGeotagToImage(webpFile, tokyoGeotag);
  const webpDataUrl = await readFileAsDataUrl(new File([taggedWebpBlob], "tagged.webp", { type: "image/webp" }));
  const webpMeta = await extractPhotoMetadata(webpDataUrl);

  assert(webpMeta.hasGps === true, "WebP must have hasGps === true");
  assert(webpMeta.gps !== null, "WebP gps object must not be null");
  assert(Math.abs(webpMeta.gps!.lat - 35.6762) < 0.0001, "WebP lat must match 35.6762");
  assert(Math.abs(webpMeta.gps!.lng - 139.6503) < 0.0001, "WebP lng must match 139.6503");
  console.log("✓ Extracted WebP GPS:", {
    lat: webpMeta.gps!.lat,
    lng: webpMeta.gps!.lng,
    dms: webpMeta.gps!.dmsFormatted,
  });

  // Test 4: Image WITHOUT GPS (Clean blank image)
  console.log("\n[Test 4] Handling Image WITHOUT GPS metadata (Graceful No-GPS state)...");
  const rawDataUrl = await readFileAsDataUrl(jpegFile);
  const noGpsMeta = await extractPhotoMetadata(rawDataUrl);

  assert(noGpsMeta.hasGps === false, "Blank image must report hasGps === false");
  assert(noGpsMeta.gps === null, "Blank image gps must be null");
  console.log("✓ Correctly identified image without GPS:", { hasGps: noGpsMeta.hasGps, gps: noGpsMeta.gps });

  // Test 5: Image WITH Camera Metadata but NO GPS
  console.log("\n[Test 5] Handling Image with Camera Metadata but NO GPS coordinates...");
  const exifObj: any = {
    "0th": {
      [piexif.ImageIFD.Make]: "Sony",
      [piexif.ImageIFD.Model]: "ILCE-7RM5",
      [piexif.ImageIFD.Software]: "v1.20",
    },
    Exif: {
      36867: "2026:08:12 10:15:30",
    },
    GPS: {},
  };
  const dumpedExif = piexif.dump(exifObj);
  const insertedDataUrl = piexif.insert(dumpedExif, rawDataUrl);
  const cameraOnlyMeta = await extractPhotoMetadata(insertedDataUrl);

  assert(cameraOnlyMeta.hasGps === false, "Camera-only image must have hasGps === false");
  assert(cameraOnlyMeta.gps === null, "Camera-only image gps must be null");
  assert(cameraOnlyMeta.camera?.make === "Sony", `Camera make should be Sony, got ${cameraOnlyMeta.camera?.make}`);
  assert(cameraOnlyMeta.camera?.model === "ILCE-7RM5", `Camera model should be ILCE-7RM5, got ${cameraOnlyMeta.camera?.model}`);
  assert(cameraOnlyMeta.dateTimeOriginal === "2026:08:12 10:15:30", `Date should match, got ${cameraOnlyMeta.dateTimeOriginal}`);
  console.log("✓ Successfully read camera details without GPS:", cameraOnlyMeta.camera, cameraOnlyMeta.dateTimeOriginal);

  // Test 6: Coordinate formatting consistency (DD and DMS)
  console.log("\n[Test 6] Validating Decimal Degree <-> DMS formatting fidelity...");
  const dmsLat = decimalToDms(40.7128, true);
  const dmsLng = decimalToDms(-74.006, false);
  assert(dmsLat.degrees === 40 && dmsLat.minutes === 42, "DMS Lat conversion correct");
  assert(dmsLng.degrees === 74 && dmsLng.minutes === 0, "DMS Lng conversion correct");
  assert(dmsLng.direction === "W", "Negative longitude formatted as West");

  console.log("\n==================================================");
  console.log("ALL PHASE 6 GPS FINDER TESTS PASSED (6/6)!");
  console.log("==================================================");
}

runGpsFinderTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
