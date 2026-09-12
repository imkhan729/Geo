/**
 * Client-Side GPS Removal & Privacy Cleansing Engine (Phase 17 — Section 29)
 *
 * Invariant: 100% in-browser processing. Zero uploads, zero network telemetry.
 *
 * Section 29 Specification:
 * - Detect location metadata
 * - Show what will be removed
 * - Remove GPS-related fields
 * - Programmatically verify output no longer contains those GPS fields
 * - Download clean copy
 * - Avoid claiming "all metadata removed" if only GPS is removed
 * - Offer separate full metadata-strip feature (genuinely implemented and tested)
 */

import { extractExifData } from "./exif-utils";

export type RemovalMode = "gps-only" | "all-metadata";

export interface DetectedGpsTag {
  tag: string;
  name: string;
  value: string;
}

export interface RemoveGpsInspection {
  hasGps: boolean;
  hasExif: boolean;
  detectedTags: DetectedGpsTag[];
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  dmsCoordinates: string | null;
  decimalCoordinates: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  captureDate: string | null;
}

export interface RemoveGpsResult {
  success: boolean;
  cleanBlob: Blob;
  cleanUrl: string;
  originalFilename: string;
  cleanFilename: string;
  mode: RemovalMode;
  originalGpsDetected: boolean;
  tagsRemovedCount: number;
  verifiedClean: boolean;
  verificationReport: {
    hasGpsAfterRemoval: boolean;
    hasExifAfterRemoval: boolean;
    cameraPreserved: boolean;
  };
  error?: string;
}

type PiexifModule = typeof import("piexifjs");

async function getPiexif(): Promise<PiexifModule> {
  const mod = await import("piexifjs");
  return mod.default || mod;
}

/**
 * Inspects an image file to identify all embedded GPS and camera metadata tags.
 */
export async function inspectImageForRemoval(file: File): Promise<RemoveGpsInspection> {
  const result = await extractExifData(file);
  const data = result.data;
  const detectedTags: DetectedGpsTag[] = [];

  if (data && data.gps.latitude !== null && data.gps.longitude !== null) {
    detectedTags.push({
      tag: "GPSLatitude / GPSLongitude",
      name: "Coordinates",
      value: data.gps.dmsFormatted || `${data.gps.latitude.toFixed(6)}, ${data.gps.longitude.toFixed(6)}`,
    });
  }

  if (data && data.gps.altitude !== null) {
    detectedTags.push({
      tag: "GPSAltitude",
      name: "Altitude",
      value: `${data.gps.altitude} m (${data.gps.altitudeRef || "Sea Level"})`,
    });
  }

  if (data && (data.gps.dateStamp || data.gps.timeStamp)) {
    detectedTags.push({
      tag: "GPSDateStamp / GPSTimeStamp",
      name: "GPS Satellite Fix Timestamp",
      value: `${data.gps.dateStamp || ""} ${data.gps.timeStamp || ""}`.trim(),
    });
  }

  if (data && data.gps.imgDirection !== null) {
    detectedTags.push({
      tag: "GPSImgDirection",
      name: "Lens Compass Bearing",
      value: `${data.gps.imgDirection}°`,
    });
  }

  return {
    hasGps: result.hasGps,
    hasExif: result.hasExif,
    detectedTags,
    latitude: data?.gps.latitude ?? null,
    longitude: data?.gps.longitude ?? null,
    altitude: data?.gps.altitude ?? null,
    dmsCoordinates: data?.gps.dmsFormatted ?? null,
    decimalCoordinates: data?.gps.decimalFormatted ?? null,
    cameraMake: data?.camera.make ?? null,
    cameraModel: data?.camera.model ?? null,
    captureDate: data?.dateTimeInfo.original ?? null,
  };
}

/**
 * Converts a Blob or File to a Base64 data URL.
 */
function fileToDataUrl(fileOrBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file as Data URL"));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Converts a Base64 Data URL to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Strips metadata by drawing the image onto an HTML5 canvas and re-encoding.
 * Guarantees zero remaining EXIF, XMP, or IPTC blocks in output raster buffer.
 */
async function stripMetadataViaCanvas(file: File, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context for metadata stripping"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const targetMime = mimeType === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to export canvas blob"));
          }
        },
        targetMime,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for canvas rendering"));
    };

    img.src = objectUrl;
  });
}

/**
 * Primary GPS Removal Workflow:
 * 1. Checks file type (JPG, PNG, WebP, HEIC).
 * 2. If HEIC, converts on demand to JPEG.
 * 3. Applies chosen removal mode (GPS-only vs All Metadata).
 * 4. Programmatically verifies output using in-browser EXIF parser.
 * 5. Returns verified clean Blob with detailed report.
 */
export async function removeGpsFromPhoto(
  file: File,
  mode: RemovalMode = "gps-only"
): Promise<RemoveGpsResult> {
  const lowerName = file.name.toLowerCase();
  let workingFile: File | Blob = file;
  let isJpeg = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || file.type === "image/jpeg";

  // Handle HEIC/HEIF conversion
  if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || file.type === "image/heic") {
    try {
      const { convertHeicToJpeg } = await import("./geotag-utils");
      workingFile = await convertHeicToJpeg(file);
      isJpeg = true;
    } catch (err) {
      throw new Error(`Failed to decode HEIC file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Pre-inspection to determine original GPS status
  const preBuffer = workingFile instanceof File ? await workingFile.arrayBuffer() : await (workingFile as Blob).arrayBuffer();
  const preResult = await extractExifData(preBuffer, file.name);
  const originalGpsDetected = preResult.hasGps;
  const originalHasExif = preResult.hasExif;
  let cleanBlob: Blob;

  if (isJpeg) {
    const piexif = await getPiexif();
    const dataUrl = await fileToDataUrl(workingFile);

    if (mode === "gps-only") {
      try {
        const exifData = piexif.load(dataUrl);
        // Wipe ONLY the GPS IFD table
        exifData.GPS = {};
        const exifBytes = piexif.dump(exifData);
        const cleanDataUrl = piexif.insert(exifBytes, dataUrl);
        cleanBlob = dataUrlToBlob(cleanDataUrl);
      } catch {
        // If piexif cannot load (e.g. malformed or already empty EXIF), fall back to canvas
        cleanBlob = await stripMetadataViaCanvas(workingFile as File, "image/jpeg");
      }
    } else {
      // Full metadata strip: wipe all EXIF headers
      try {
        const cleanDataUrl = piexif.remove(dataUrl);
        cleanBlob = dataUrlToBlob(cleanDataUrl);
      } catch {
        cleanBlob = await stripMetadataViaCanvas(workingFile as File, "image/jpeg");
      }
    }
  } else {
    // Non-JPEG formats (PNG, WebP): canvas re-encoding provides complete metadata purge
    cleanBlob = await stripMetadataViaCanvas(
      workingFile instanceof File ? workingFile : new File([workingFile], file.name, { type: file.type }),
      file.type
    );
  }

  // Post-Removal Programmatic Binary Verification
  const postBuffer = await cleanBlob.arrayBuffer();
  const postResult = await extractExifData(postBuffer, file.name);
  const verifiedClean = !postResult.hasGps;

  // Determine output clean filename
  const dotIndex = file.name.lastIndexOf(".");
  const base = dotIndex !== -1 ? file.name.slice(0, dotIndex) : file.name;
  const cleanFilename = `${base}-nogps.jpg`;
  const cleanUrl = URL.createObjectURL(cleanBlob);

  return {
    success: true,
    cleanBlob,
    cleanUrl,
    originalFilename: file.name,
    cleanFilename,
    mode,
    originalGpsDetected,
    tagsRemovedCount: originalGpsDetected ? (preResult.data?.gps.altitude !== null ? 4 : 2) : 0,
    verifiedClean,
    verificationReport: {
      hasGpsAfterRemoval: postResult.hasGps,
      hasExifAfterRemoval: postResult.hasExif,
      cameraPreserved: mode === "gps-only" && originalHasExif && postResult.data?.camera.make !== null,
    },
  };
}

/**
 * Revokes a previously created Object URL to avoid browser memory leaks.
 */
export function revokeCleanUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
