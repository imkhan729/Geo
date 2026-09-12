/**
 * Client-Side EXIF Metadata Extraction Utility (Phase 17 — Section 28)
 *
 * Implements 100% in-browser metadata parsing using ExifReader.
 * Privacy Invariant: Zero uploads. Files are parsed entirely in memory
 * using FileReader / ArrayBuffer APIs.
 *
 * Grouped categories strictly align with Section 28:
 * - Camera (Make, Model, Lens, Focal Length, 35mm Equiv, Aperture, Shutter, ISO, Flash, Metering)
 * - Date/Time (Capture Time, Digitized Time, Modified Time, Offset)
 * - Dimensions & Geometry (Width, Height, Megapixels, Aspect Ratio, Orientation)
 * - GPS Location (Latitude, Longitude, Altitude, Direction, DD & DMS, Map Links)
 * - Software & Technical (Software name, Color Space, File Type, Bits Per Sample)
 * - Copyright & Attribution (Artist, Copyright notice, Description, User Comments)
 */

export interface CameraMetadata {
  make: string | null;
  model: string | null;
  lensModel: string | null;
  focalLength: string | null;
  focalLength35mm: string | null;
  fNumber: string | null;
  exposureTime: string | null;
  iso: number | null;
  exposureProgram: string | null;
  meteringMode: string | null;
  flash: string | null;
  whiteBalance: string | null;
}

export interface DateTimeMetadata {
  original: string | null;
  digitized: string | null;
  modified: string | null;
  offsetTime: string | null;
}

export interface GeometryMetadata {
  width: number | null;
  height: number | null;
  megapixels: string | null;
  aspectRatio: string | null;
  orientation: string | null;
  orientationCode: number | null;
}

export interface GpsMetadata {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  altitudeRef: string | null;
  dmsFormatted: string | null;
  decimalFormatted: string | null;
  dateStamp: string | null;
  timeStamp: string | null;
  imgDirection: number | null;
  googleMapsUrl: string | null;
  osmUrl: string | null;
}

export interface SoftwareMetadata {
  software: string | null;
  colorSpace: string | null;
  bitsPerSample: string | null;
  fileType: string | null;
  fileSizeFormatted: string | null;
}

export interface CopyrightMetadata {
  artist: string | null;
  copyright: string | null;
  imageDescription: string | null;
  userComment: string | null;
}

export interface RawTagItem {
  id: string;
  name: string;
  group: string;
  value: string;
  description?: string;
}

export interface ExifData {
  // Legacy fields for backward compatibility with existing components
  dateTime: string | null;
  image: {
    width: number | null;
    height: number | null;
    orientation: string | null;
  };
  software: string | null;
  exposureTime: string | null;
  fNumber: string | null;
  iso: number | null;
  focalLength: string | null;
  flash: string | null;

  // Grouped fields strictly aligning with Section 28
  camera: CameraMetadata;
  dateTimeInfo: DateTimeMetadata;
  geometry: GeometryMetadata;
  gps: GpsMetadata;
  softwareInfo: SoftwareMetadata;
  copyright: CopyrightMetadata;
  totalTagsCount: number;
}

export interface ExifResult {
  success: boolean;
  hasExif: boolean;
  hasGps: boolean;
  data: ExifData | null;
  rawTags: Record<string, unknown> | null;
  rawTagsList: RawTagItem[];
  error: string | null;
}

/**
 * Format decimal degrees into standard DMS string (e.g. 40° 42' 46.8" N)
 */
export function formatDms(deg: number, isLatitude: boolean): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(1);
  const direction = isLatitude ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
  return `${d}° ${m}' ${s}" ${direction}`;
}

/**
 * Format coordinates as standard combined string
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${formatDms(lat, true)}, ${formatDms(lng, false)}`;
}

export function formatCoordinatesDecimal(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Calculate aspect ratio string (e.g. 4:3, 16:9, 3:2, 1:1)
 */
export function calculateAspectRatio(w?: number | null, h?: number | null): string | null {
  if (!w || !h || w <= 0 || h <= 0) return null;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(w, h);
  const ratioW = w / divisor;
  const ratioH = h / divisor;
  
  const dec = w / h;
  if (Math.abs(dec - 16 / 9) < 0.02) return "16:9";
  if (Math.abs(dec - 4 / 3) < 0.02) return "4:3";
  if (Math.abs(dec - 3 / 2) < 0.02) return "3:2";
  if (Math.abs(dec - 1) < 0.02) return "1:1";
  if (Math.abs(dec - 9 / 16) < 0.02) return "9:16";
  if (Math.abs(dec - 3 / 4) < 0.02) return "3:4";
  if (Math.abs(dec - 2 / 3) < 0.02) return "2:3";

  if (ratioW < 50 && ratioH < 50) {
    return `${ratioW}:${ratioH}`;
  }
  return `${dec.toFixed(2)}:1`;
}

/**
 * Calculate Megapixels from dimensions
 */
export function calculateMegapixels(w?: number | null, h?: number | null): string | null {
  if (!w || !h || w <= 0 || h <= 0) return null;
  const mp = (w * h) / 1_000_000;
  return `${mp.toFixed(1)} MP`;
}

/**
 * Human-readable byte formatting
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getString(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "object" && val !== null) {
    if ("description" in val && (val as { description: unknown }).description) {
      const desc = String((val as { description: unknown }).description).trim();
      if (desc && desc !== "undefined") return desc;
    }
    if ("value" in val && (val as { value: unknown }).value !== undefined) {
      const v = (val as { value: unknown }).value;
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (Array.isArray(v) && v.length > 0) return v.join(", ");
    }
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return null;
}

function getNumber(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "object" && val !== null && "value" in val) {
    const inner = (val as { value: unknown }).value;
    if (typeof inner === "number") return inner;
    if (typeof inner === "string") {
      const parsed = parseFloat(inner);
      return isNaN(parsed) ? null : parsed;
    }
  }
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Extract comprehensive EXIF, TIFF, XMP, and GPS metadata from File or ArrayBuffer.
 */
export async function extractExifData(
  input: File | ArrayBuffer,
  fileName = "photo.jpg",
  fileSizeBytes = 0
): Promise<ExifResult> {
  let actualName = fileName;
  let actualSize = fileSizeBytes;

  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof File !== "undefined" && input instanceof File) {
      actualName = input.name;
      actualSize = input.size;

      // Handle HEIC files by converting on demand
      const lowerName = input.name.toLowerCase();
      if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || input.type === "image/heic") {
        try {
          const { convertHeicToJpeg } = await import("./geotag-utils");
          const convertedBlob = await convertHeicToJpeg(input);
          arrayBuffer = await convertedBlob.arrayBuffer();
        } catch {
          arrayBuffer = await input.arrayBuffer();
        }
      } else {
        arrayBuffer = await input.arrayBuffer();
      }
    } else {
      arrayBuffer = input as ArrayBuffer;
    }

    const ExifReaderModule = await import("exifreader");
    const ExifReader = ExifReaderModule.default || ExifReaderModule;
    const tags = await ExifReader.load(arrayBuffer, { expanded: true });

    const rawGps = (tags.gps || {}) as Record<string, unknown>;
    const rawExif = (tags.exif || {}) as Record<string, unknown>;
    const rawIptc = (tags.iptc || {}) as Record<string, unknown>;
    const rawXmp = (tags.xmp || {}) as Record<string, unknown>;
    const rawFile = (tags.file || {}) as Record<string, unknown>;
    const rawImage = ((tags as unknown as { image?: Record<string, unknown> }).image || {}) as Record<string, unknown>;

    // 1. GPS Location Fields
    let latitude: number | null = null;
    let longitude: number | null = null;
    let altitude: number | null = null;
    let altitudeRef: string | null = null;

    if (rawGps.Latitude !== undefined && typeof rawGps.Latitude === "number") {
      latitude = rawGps.Latitude;
    }
    if (rawGps.Longitude !== undefined && typeof rawGps.Longitude === "number") {
      longitude = rawGps.Longitude;
    }
    if (rawGps.Altitude !== undefined) {
      altitude = getNumber(rawGps.Altitude);
      altitudeRef = getString(rawGps.AltitudeRef);
    }

    const hasGps = latitude !== null && longitude !== null;
    const dmsFormatted = hasGps ? formatCoordinates(latitude!, longitude!) : null;
    const decimalFormatted = hasGps ? formatCoordinatesDecimal(latitude!, longitude!) : null;
    const googleMapsUrl = hasGps ? `https://www.google.com/maps?q=${latitude!.toFixed(6)},${longitude!.toFixed(6)}` : null;
    const osmUrl = hasGps ? `https://www.openstreetmap.org/?mlat=${latitude!.toFixed(6)}&mlon=${longitude!.toFixed(6)}#map=16/${latitude!.toFixed(6)}/${longitude!.toFixed(6)}` : null;

    const gps: GpsMetadata = {
      latitude,
      longitude,
      altitude,
      altitudeRef,
      dmsFormatted,
      decimalFormatted,
      dateStamp: getString(rawGps.GPSDateStamp) || getString(rawGps.DateStamp),
      timeStamp: getString(rawGps.GPSTimeStamp) || getString(rawGps.TimeStamp),
      imgDirection: getNumber(rawGps.GPSImgDirection) || getNumber(rawGps.ImgDirection),
      googleMapsUrl,
      osmUrl,
    };

    // 2. Camera & Exposure
    const make = getString(rawImage.Make) || getString(rawExif.Make) || null;
    const model = getString(rawImage.Model) || getString(rawExif.Model) || null;
    const lensModel = getString(rawExif.LensModel) || getString(rawXmp.LensModel) || null;
    const focalLength = getString(rawExif.FocalLength) || null;
    const focalLength35mm = getString(rawExif.FocalLengthIn35mmFilm) || null;
    const fNumber = getString(rawExif.FNumber) || null;
    const exposureTime = getString(rawExif.ExposureTime) || null;
    const iso = getNumber(rawExif.ISOSpeedRatings) || getNumber(rawExif.PhotographicSensitivity) || null;
    const exposureProgram = getString(rawExif.ExposureProgram) || null;
    const meteringMode = getString(rawExif.MeteringMode) || null;
    const flash = getString(rawExif.Flash) || null;
    const whiteBalance = getString(rawExif.WhiteBalance) || null;

    const camera: CameraMetadata = {
      make,
      model,
      lensModel,
      focalLength,
      focalLength35mm,
      fNumber,
      exposureTime,
      iso,
      exposureProgram,
      meteringMode,
      flash,
      whiteBalance,
    };

    // 3. Date & Time
    const originalDate = getString(rawExif.DateTimeOriginal) || null;
    const digitizedDate = getString(rawExif.DateTimeDigitized) || null;
    const modifiedDate = getString(rawImage.DateTime) || getString(rawExif.DateTime) || null;
    const offsetTime = getString(rawExif.OffsetTimeOriginal) || getString(rawExif.OffsetTime) || null;

    const dateTimeInfo: DateTimeMetadata = {
      original: originalDate,
      digitized: digitizedDate,
      modified: modifiedDate,
      offsetTime,
    };

    // 4. Dimensions & Geometry
    const width = getNumber(rawImage["Image Width"]) || getNumber(rawFile["Image Width"]) || getNumber(rawExif.PixelXDimension);
    const height = getNumber(rawImage["Image Height"]) || getNumber(rawFile["Image Height"]) || getNumber(rawExif.PixelYDimension);
    const orientationDesc = getString(rawImage.Orientation) || getString(rawExif.Orientation) || null;
    const orientationCode = getNumber(rawImage.Orientation) || getNumber(rawExif.Orientation) || null;

    const geometry: GeometryMetadata = {
      width,
      height,
      megapixels: calculateMegapixels(width, height),
      aspectRatio: calculateAspectRatio(width, height),
      orientation: orientationDesc,
      orientationCode,
    };

    // 5. Software & Technical
    const software = getString(rawImage.Software) || getString(rawExif.Software) || null;
    const colorSpace = getString(rawExif.ColorSpace) || null;
    const bitsPerSample = getString(rawImage.BitsPerSample) || getString(rawFile["Bits Per Sample"]) || null;
    const fileType = getString(rawFile["File Type"]) || getString(rawFile.FileType) || (actualName.split(".").pop() || "").toUpperCase() || null;
    const fileSizeFormatted = actualSize > 0 ? formatBytes(actualSize) : null;

    const softwareInfo: SoftwareMetadata = {
      software,
      colorSpace,
      bitsPerSample,
      fileType,
      fileSizeFormatted,
    };

    // 6. Copyright & Attribution
    const copyright: CopyrightMetadata = {
      artist: getString(rawImage.Artist) || getString(rawIptc["By-line"]) || getString(rawIptc.byline) || null,
      copyright: getString(rawImage.Copyright) || getString(rawIptc.Copyright) || getString(rawIptc.copyright) || null,
      imageDescription: getString(rawImage.ImageDescription) || getString(rawIptc.Caption) || getString(rawIptc.caption) || null,
      userComment: getString(rawExif.UserComment) || null,
    };

    // Build raw tags list for inspection table
    const rawTagsList: RawTagItem[] = [];
    const groups: Array<{ name: string; dict?: Record<string, unknown> }> = [
      { name: "Camera / Image", dict: rawImage },
      { name: "EXIF", dict: rawExif },
      { name: "GPS", dict: rawGps },
      { name: "IPTC", dict: rawIptc },
      { name: "XMP", dict: rawXmp },
      { name: "File", dict: rawFile },
    ];

    for (const g of groups) {
      if (!g.dict) continue;
      for (const [tagKey, tagVal] of Object.entries(g.dict)) {
        const strVal = getString(tagVal);
        if (strVal !== null && strVal !== "") {
          let desc: string | undefined;
          if (typeof tagVal === "object" && tagVal !== null && "description" in tagVal) {
            desc = String((tagVal as { description: unknown }).description);
          }
          rawTagsList.push({
            id: `${g.name}-${tagKey}`,
            name: tagKey,
            group: g.name,
            value: strVal,
            description: desc,
          });
        }
      }
    }

    const totalTagsCount = rawTagsList.length;
    const hasExif =
      totalTagsCount > 0 &&
      (camera.make !== null ||
        camera.model !== null ||
        dateTimeInfo.original !== null ||
        hasGps ||
        softwareInfo.software !== null ||
        camera.iso !== null ||
        camera.fNumber !== null ||
        camera.exposureTime !== null);

    const exifData: ExifData = {
      // Legacy backward-compatibility accessors
      dateTime: originalDate || modifiedDate || digitizedDate,
      image: {
        width,
        height,
        orientation: orientationDesc,
      },
      software,
      exposureTime,
      fNumber,
      iso,
      focalLength,
      flash,

      // Grouped accessors
      camera,
      dateTimeInfo,
      geometry,
      gps,
      softwareInfo,
      copyright,
      totalTagsCount,
    };

    return {
      success: true,
      hasExif,
      hasGps,
      data: exifData,
      rawTags: tags as unknown as Record<string, unknown>,
      rawTagsList,
      error: null,
    };
  } catch (err) {
    // If no EXIF/metadata found, return graceful empty structure with hasExif: false
    return {
      success: true,
      hasExif: false,
      hasGps: false,
      data: createEmptyExifData(actualName, actualSize),
      rawTags: null,
      rawTagsList: [],
      error: null,
    };
  }
}

/**
 * Returns an empty ExifData structure with null fields
 */
export function createEmptyExifData(fileName = "photo.jpg", fileSizeBytes = 0): ExifData {
  return {
    dateTime: null,
    image: { width: null, height: null, orientation: null },
    software: null,
    exposureTime: null,
    fNumber: null,
    iso: null,
    focalLength: null,
    flash: null,
    camera: {
      make: null,
      model: null,
      lensModel: null,
      focalLength: null,
      focalLength35mm: null,
      fNumber: null,
      exposureTime: null,
      iso: null,
      exposureProgram: null,
      meteringMode: null,
      flash: null,
      whiteBalance: null,
    },
    dateTimeInfo: {
      original: null,
      digitized: null,
      modified: null,
      offsetTime: null,
    },
    geometry: {
      width: null,
      height: null,
      megapixels: null,
      aspectRatio: null,
      orientation: null,
      orientationCode: null,
    },
    gps: {
      latitude: null,
      longitude: null,
      altitude: null,
      altitudeRef: null,
      dmsFormatted: null,
      decimalFormatted: null,
      dateStamp: null,
      timeStamp: null,
      imgDirection: null,
      googleMapsUrl: null,
      osmUrl: null,
    },
    softwareInfo: {
      software: null,
      colorSpace: null,
      bitsPerSample: null,
      fileType: (fileName.split(".").pop() || "").toUpperCase() || null,
      fileSizeFormatted: fileSizeBytes > 0 ? formatBytes(fileSizeBytes) : null,
    },
    copyright: {
      artist: null,
      copyright: null,
      imageDescription: null,
      userComment: null,
    },
    totalTagsCount: 0,
  };
}

/**
 * Generate a formatted plain-text summary suitable for copying or saving.
 */
export function generateMetadataSummary(data: ExifData, fileName: string): string {
  const lines: string[] = [
    `=== EXIF Metadata Summary: ${fileName} ===`,
    `Generated by FreeGeoTagger (https://freegeotagger.com/exif-viewer)`,
    "",
    "--- Camera & Exposure ---",
    `Camera Make:       ${data.camera.make || "Not specified"}`,
    `Camera Model:      ${data.camera.model || "Not specified"}`,
    `Lens:              ${data.camera.lensModel || "Not specified"}`,
    `Focal Length:      ${data.camera.focalLength || "Not specified"}${data.camera.focalLength35mm ? ` (${data.camera.focalLength35mm} 35mm equiv)` : ""}`,
    `Aperture:          ${data.camera.fNumber || "Not specified"}`,
    `Shutter Speed:     ${data.camera.exposureTime || "Not specified"}`,
    `ISO:               ${data.camera.iso ?? "Not specified"}`,
    `Exposure Program:  ${data.camera.exposureProgram || "Not specified"}`,
    `Metering Mode:     ${data.camera.meteringMode || "Not specified"}`,
    `Flash:             ${data.camera.flash || "Not specified"}`,
    `White Balance:     ${data.camera.whiteBalance || "Not specified"}`,
    "",
    "--- Date & Time ---",
    `Date Taken:        ${data.dateTimeInfo.original || "Not specified"}`,
    `Date Digitized:    ${data.dateTimeInfo.digitized || "Not specified"}`,
    `Date Modified:     ${data.dateTimeInfo.modified || "Not specified"}`,
    "",
    "--- Dimensions & Geometry ---",
    `Resolution:        ${data.geometry.width && data.geometry.height ? `${data.geometry.width} × ${data.geometry.height} px` : "Unknown"}`,
    `Megapixels:        ${data.geometry.megapixels || "Unknown"}`,
    `Aspect Ratio:      ${data.geometry.aspectRatio || "Unknown"}`,
    `Orientation:       ${data.geometry.orientation || "Normal (Horizontal)"}`,
    "",
    "--- GPS Location ---",
    `Latitude:          ${data.gps.latitude !== null ? `${data.gps.latitude.toFixed(6)}°` : "No GPS data"}`,
    `Longitude:         ${data.gps.longitude !== null ? `${data.gps.longitude.toFixed(6)}°` : "No GPS data"}`,
    `Altitude:          ${data.gps.altitude !== null ? `${data.gps.altitude} m` : "Not recorded"}`,
    `DMS Coordinates:   ${data.gps.dmsFormatted || "None"}`,
    `Google Maps:       ${data.gps.googleMapsUrl || "None"}`,
    "",
    "--- Technical & Software ---",
    `Software:          ${data.softwareInfo.software || "Not recorded"}`,
    `Color Space:       ${data.softwareInfo.colorSpace || "sRGB"}`,
    `File Size:         ${data.softwareInfo.fileSizeFormatted || "Unknown"}`,
    "",
    "--- Copyright & Attribution ---",
    `Artist / Creator:  ${data.copyright.artist || "None"}`,
    `Copyright:         ${data.copyright.copyright || "None"}`,
    `Description:       ${data.copyright.imageDescription || "None"}`,
  ];

  return lines.join("\n");
}
