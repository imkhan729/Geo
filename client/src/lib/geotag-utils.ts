import { geocoder, type PlaceResult } from "./geocoding";

type PiexifModule = typeof import("piexifjs");

async function getPiexif(): Promise<PiexifModule> {
  return (await import("piexifjs")).default;
}

export interface GeotagData {
  latitude: number;
  longitude: number;
  altitude?: number;
  keywords?: string;
  description?: string;
}

export type PlaceSuggestion = PlaceResult;
export type { PlaceResult };

export interface DmsCoordinate {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: "N" | "S" | "E" | "W";
  formatted: string;
}

export interface VerificationResult {
  isValid: boolean;
  format: "jpeg" | "png" | "webp" | "unknown";
  coordinatesVerified: boolean;
  extractedGps?: {
    lat: number;
    lng: number;
    altitude?: number;
  };
  diffLatDegrees: number;
  diffLngDegrees: number;
  diffMeters: number;
  altitudeVerified?: boolean;
  error?: string;
  details?: {
    hasApp1OrExifChunk: boolean;
    hasGpsIfd: boolean;
    headerValid: boolean;
    crcValid?: boolean;
  };
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  type: string;
  size: number;
  existingGps?: { lat: number; lng: number; altitude?: number } | null;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  verification?: VerificationResult;
}

function degToDmsRational(deg: number): [[number, number], [number, number], [number, number]] {
  const absolute = Math.abs(deg);
  let degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  let minutes = Math.floor(minutesFloat);
  let seconds = Math.round((minutesFloat - minutes) * 60 * 100);

  // Normalize potential boundary over-rounding (e.g. 59.999 -> 60.00)
  if (seconds >= 6000) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100]
  ];
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95
  });

  return Array.isArray(result) ? result[0] : result;
}

function safeAtob(base64: string): string {
  if (typeof atob === "function") return atob(base64);
  if (typeof Buffer !== "undefined") return Buffer.from(base64, "base64").toString("binary");
  return "";
}

export async function readFileAsDataUrl(file: File | Blob): Promise<string> {
  let mimeType = file.type;
  if (!mimeType && "name" in file && typeof (file as File).name === "string") {
    const name = (file as File).name.toLowerCase();
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) mimeType = "image/jpeg";
    else if (name.endsWith(".png")) mimeType = "image/png";
    else if (name.endsWith(".webp")) mimeType = "image/webp";
  }

  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let res = reader.result as string;
        if (mimeType && res.startsWith("data:application/octet-stream;")) {
          res = `data:${mimeType};` + res.substring(res.indexOf(";base64,") + 1);
        }
        resolve(res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (!mimeType || mimeType === "application/octet-stream") {
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
      mimeType = "image/jpeg";
    } else if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      mimeType = "image/png";
    } else if (buf.length >= 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") {
      mimeType = "image/webp";
    } else {
      mimeType = "application/octet-stream";
    }
  }
  return `data:${mimeType};base64,${buf.toString("base64")}`;
}

export async function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return await file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/** Convert a generated data URL locally. Do not use fetch(data:...) here: the
 * site's strict CSP correctly rejects that as a network request in some browsers. */
function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(?:;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) throw new Error("Could not prepare the geotagged image for saving.");
  const mimeType = match[1] || "application/octet-stream";
  const binary = safeAtob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Some phone and messaging apps give JPEG files an extension and MIME type even
 * though their internal marker layout is not accepted by piexif.  The browser
 * can still decode those files, so use a JPEG normalisation only as a fallback
 * instead of rejecting an otherwise usable photo.
 */
async function normaliseDecodableImageToJpeg(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not prepare this image for GPS tagging.");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("This image could not be decoded by your browser."));
    image.src = dataUrl;
  });
}

export interface ExtractedPhotoDetails {
  hasGps: boolean;
  gps: {
    lat: number;
    lng: number;
    altitude?: number;
    altitudeMeters?: number;
    altitudeFeet?: number;
    dmsLat: DmsCoordinate;
    dmsLng: DmsCoordinate;
    dmsFormatted: string;
    dateStamp?: string;
    timeStamp?: string;
  } | null;
  camera?: {
    make?: string;
    model?: string;
    software?: string;
  };
  dateTimeOriginal?: string;
  imageDescription?: string;
}

export async function extractPhotoMetadata(dataUrl: string): Promise<ExtractedPhotoDetails> {
  try {
    const piexif = await getPiexif();
    let exifPayload = dataUrl;

    if (dataUrl.startsWith("data:image/png")) {
      const base64 = dataUrl.split(',')[1];
      const binaryStr = safeAtob(base64);
      let pos = 8;
      let found = false;
      while (pos < binaryStr.length) {
        if (pos + 8 > binaryStr.length) break;
        const len = (binaryStr.charCodeAt(pos) << 24) | (binaryStr.charCodeAt(pos+1) << 16) | (binaryStr.charCodeAt(pos+2) << 8) | binaryStr.charCodeAt(pos+3);
        const tag = binaryStr.substring(pos+4, pos+8);
        if (tag === 'eXIf') {
          const tiffStr = binaryStr.substring(pos+8, pos+8+len);
          exifPayload = "Exif\x00\x00" + tiffStr;
          found = true;
          break;
        }
        pos += 12 + len;
      }
      if (!found) {
        return { hasGps: false, gps: null };
      }
    } else if (dataUrl.startsWith("data:image/webp")) {
      const base64 = dataUrl.split(',')[1];
      const binaryStr = safeAtob(base64);
      let pos = 12;
      let found = false;
      while (pos < binaryStr.length) {
        if (pos + 8 > binaryStr.length) break;
        const tag = binaryStr.substring(pos, pos+4);
        const len = binaryStr.charCodeAt(pos+4) | (binaryStr.charCodeAt(pos+5) << 8) | (binaryStr.charCodeAt(pos+6) << 16) | (binaryStr.charCodeAt(pos+7) << 24);
        const paddedLen = len % 2 !== 0 ? len + 1 : len;
        if (tag === 'EXIF') {
          const tiffStr = binaryStr.substring(pos+8, pos+8+len);
          if (!tiffStr.startsWith("Exif\x00\x00")) {
            exifPayload = "Exif\x00\x00" + tiffStr;
          } else {
            exifPayload = tiffStr;
          }
          found = true;
          break;
        }
        pos += 8 + paddedLen;
      }
      if (!found) {
        return { hasGps: false, gps: null };
      }
    } else if (dataUrl.startsWith("data:") && !dataUrl.startsWith("data:image/jpeg")) {
      const commaIdx = dataUrl.indexOf(",");
      if (commaIdx !== -1) {
        exifPayload = "data:image/jpeg;base64," + dataUrl.substring(commaIdx + 1);
      }
    }

    const exifData = piexif.load(exifPayload);
    const zeroth = exifData["0th"] || {};
    const exifIfd = exifData["Exif"] || {};
    const gpsData = exifData.GPS || {};

    const cameraMake = typeof zeroth[piexif.ImageIFD.Make] === "string" ? (zeroth[piexif.ImageIFD.Make] as string).trim() : undefined;
    const cameraModel = typeof zeroth[piexif.ImageIFD.Model] === "string" ? (zeroth[piexif.ImageIFD.Model] as string).trim() : undefined;
    const software = typeof zeroth[piexif.ImageIFD.Software] === "string" ? (zeroth[piexif.ImageIFD.Software] as string).trim() : undefined;
    const imageDesc = typeof zeroth[piexif.ImageIFD.ImageDescription] === "string" ? (zeroth[piexif.ImageIFD.ImageDescription] as string).trim() : undefined;
    const rawDateTimeOriginal = (exifIfd as any)[0x9003] || (exifIfd as any)[36867];
    const rawDateTime = zeroth[piexif.ImageIFD.DateTime];
    const dateTime = typeof rawDateTimeOriginal === "string" 
      ? rawDateTimeOriginal.trim() 
      : typeof rawDateTime === "string" 
        ? (rawDateTime as string).trim() 
        : undefined;

    const camera = (cameraMake || cameraModel || software) ? { make: cameraMake, model: cameraModel, software } : undefined;

    if (!gpsData[piexif.GPSIFD.GPSLatitude] || !gpsData[piexif.GPSIFD.GPSLongitude]) {
      return {
        hasGps: false,
        gps: null,
        camera,
        dateTimeOriginal: dateTime,
        imageDescription: imageDesc,
      };
    }

    const latDms = gpsData[piexif.GPSIFD.GPSLatitude] as [[number, number], [number, number], [number, number]];
    const latRef = (gpsData[piexif.GPSIFD.GPSLatitudeRef] as string) || "N";
    const lngDms = gpsData[piexif.GPSIFD.GPSLongitude] as [[number, number], [number, number], [number, number]];
    const lngRef = (gpsData[piexif.GPSIFD.GPSLongitudeRef] as string) || "E";

    const lat = rationalDmsToDecimal(latDms, latRef);
    const lng = rationalDmsToDecimal(lngDms, lngRef);

    let altitudeMeters: number | undefined = undefined;
    let altitudeFeet: number | undefined = undefined;

    if (gpsData[piexif.GPSIFD.GPSAltitude]) {
      const altRat = gpsData[piexif.GPSIFD.GPSAltitude] as [number, number];
      const altRef = gpsData[piexif.GPSIFD.GPSAltitudeRef] as number | undefined;
      if (Array.isArray(altRat) && altRat[1] && altRat[1] !== 0) {
        const altitude = (altRat[0] / altRat[1]) * (altRef === 1 ? -1 : 1);
        altitudeMeters = Math.round(altitude * 10) / 10;
        altitudeFeet = Math.round(altitude * 3.28084 * 10) / 10;
      }
    }

    const dmsLat = decimalToDms(lat, true);
    const dmsLng = decimalToDms(lng, false);
    const dmsFormatted = `${dmsLat.formatted}, ${dmsLng.formatted}`;

    const dateStamp = typeof gpsData[29] === "string" ? gpsData[29] : undefined;
    let timeStamp: string | undefined = undefined;
    if (Array.isArray(gpsData[7]) && gpsData[7].length === 3) {
      const h = String(gpsData[7][0][0] / gpsData[7][0][1]).padStart(2, "0");
      const m = String(gpsData[7][1][0] / gpsData[7][1][1]).padStart(2, "0");
      const s = String(Math.floor(gpsData[7][2][0] / gpsData[7][2][1])).padStart(2, "0");
      timeStamp = `${h}:${m}:${s} UTC`;
    }

    return {
      hasGps: true,
      gps: {
        lat,
        lng,
        altitude: altitudeMeters,
        altitudeMeters,
        altitudeFeet,
        dmsLat,
        dmsLng,
        dmsFormatted,
        dateStamp,
        timeStamp,
      },
      camera,
      dateTimeOriginal: dateTime,
      imageDescription: imageDesc,
    };
  } catch {
    return { hasGps: false, gps: null };
  }
}

export async function extractExistingGps(dataUrl: string): Promise<{ lat: number; lng: number; altitude?: number } | null> {
  const meta = await extractPhotoMetadata(dataUrl);
  if (!meta.hasGps || !meta.gps) return null;
  return {
    lat: meta.gps.lat,
    lng: meta.gps.lng,
    altitude: meta.gps.altitude,
  };
}

function stringToUtf16Le(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    bytes.push(charCode & 0xFF);
    bytes.push((charCode >> 8) & 0xFF);
  }
  bytes.push(0, 0);
  return bytes;
}

function rationalDmsToDecimal(dms: [[number, number], [number, number], [number, number]], ref: string): number {
  const degrees = dms[0][0] / dms[0][1];
  const minutes = dms[1][0] / dms[1][1];
  const seconds = dms[2][0] / dms[2][1];

  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (ref === "S" || ref === "W") {
    decimal = -decimal;
  }

  return decimal;
}

export function decimalToDms(val: number, isLat: boolean): DmsCoordinate {
  const direction: "N" | "S" | "E" | "W" = isLat
    ? (val >= 0 ? "N" : "S")
    : (val >= 0 ? "E" : "W");
  const absolute = Math.abs(val);
  let degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  let minutes = Math.floor(minutesFloat);
  let seconds = Math.round((minutesFloat - minutes) * 60 * 100) / 100;

  if (seconds >= 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }

  const formatted = `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
  return { degrees, minutes, seconds, direction, formatted };
}

export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: "N" | "S" | "E" | "W"
): number {
  const deg = Math.max(0, degrees || 0);
  const min = Math.max(0, Math.min(59.9999, minutes || 0));
  const sec = Math.max(0, Math.min(59.9999, seconds || 0));
  const decimal = deg + min / 60 + sec / 3600;
  const result = (direction === "S" || direction === "W") ? -decimal : decimal;
  return Math.round(result * 1000000) / 1000000;
}

export function formatCoordinates(lat: number, lng: number, format: "decimal" | "dms" = "decimal"): string {
  if (format === "dms") {
    const latDms = decimalToDms(lat, true);
    const lngDms = decimalToDms(lng, false);
    return `${latDms.formatted}, ${lngDms.formatted}`;
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth mean radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

async function extractExifBytesFromWebP(file: File): Promise<string | null> {
  const buffer = await readFileAsArrayBuffer(file);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const getStr = (arr: Uint8Array) => Array.from(arr).map(b => String.fromCharCode(b)).join('');
  if (getStr(bytes.slice(0, 4)) !== 'RIFF' || getStr(bytes.slice(8, 12)) !== 'WEBP') return null;
  let pos = 12;
  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) break;
    const tag = getStr(bytes.slice(pos, pos + 4));
    const size = view.getUint32(pos + 4, true);
    if (pos + 8 + size > bytes.length) break;
    if (tag === 'EXIF') {
      const payload = bytes.slice(pos + 8, pos + 8 + size);
      return Array.from(payload).map(b => String.fromCharCode(b)).join('');
    }
    const paddedSize = size % 2 !== 0 ? size + 1 : size;
    pos += 8 + paddedSize;
  }
  return null;
}

async function extractExifBytesFromPNG(file: File): Promise<string | null> {
  const buffer = await readFileAsArrayBuffer(file);
  const bytes = new Uint8Array(buffer);
  let pos = 8;
  while (pos < bytes.length) {
    if (pos + 12 > bytes.length) break;
    const len = (bytes[pos] << 24) | (bytes[pos+1] << 16) | (bytes[pos+2] << 8) | bytes[pos+3];
    if (len < 0 || pos + 12 + len > bytes.length) break;
    const type = String.fromCharCode(bytes[pos+4], bytes[pos+5], bytes[pos+6], bytes[pos+7]);
    if (type === 'eXIf') {
      const payload = bytes.slice(pos + 8, pos + 8 + len);
      return Array.from(payload).map(b => String.fromCharCode(b)).join('');
    }
    pos += 12 + len;
  }
  return null;
}

function stringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function uint32ToBytes(val: number): Uint8Array {
  return new Uint8Array([val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff]);
}

function uint24ToBytes(val: number): Uint8Array {
  return new Uint8Array([val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff]);
}

async function injectExifIntoWebP(originalFile: File, exifBytesStr: string): Promise<Blob> {
  const buffer = await readFileAsArrayBuffer(originalFile);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const getStr = (arr: Uint8Array) => Array.from(arr).map(b => String.fromCharCode(b)).join('');
  
  if (getStr(bytes.slice(0, 4)) !== 'RIFF' || getStr(bytes.slice(8, 12)) !== 'WEBP') {
    return originalFile;
  }

  let pos = 12;
  let vp8xFlags = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let chunks: {tag: string, payload: Uint8Array}[] = [];
  
  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) break;
    const tag = getStr(bytes.slice(pos, pos + 4));
    const size = view.getUint32(pos + 4, true);
    const paddedSize = size % 2 !== 0 ? size + 1 : size;
    if (pos + 8 + size > bytes.length) break;
    const payload = bytes.slice(pos + 8, pos + 8 + size);
    
    if (tag === 'VP8X') {
      vp8xFlags = payload[0];
      canvasWidth = 1 + (payload[4] | (payload[5] << 8) | (payload[6] << 16));
      canvasHeight = 1 + (payload[7] | (payload[8] << 8) | (payload[9] << 16));
    } else if (tag === 'EXIF') {
       // skip
    } else {
      chunks.push({tag, payload});
      if (!canvasWidth && (tag === 'VP8 ' || tag === 'VP8L')) {
         if (tag === 'VP8 ' && payload[3] === 0x9d && payload[4] === 0x01 && payload[5] === 0x2a) {
             canvasWidth = payload[6] | ((payload[7] & 0x3f) << 8);
             canvasHeight = payload[8] | ((payload[9] & 0x3f) << 8);
         } else if (tag === 'VP8L') {
             let b1 = payload[1], b2 = payload[2], b3 = payload[3], b4 = payload[4];
             canvasWidth = 1 + (((b2 & 0x3F) << 8) | b1);
             canvasHeight = 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));
         }
      }
    }
    pos += 8 + paddedSize;
  }

  vp8xFlags |= 0x08; 
  let exifPayload;
  if (exifBytesStr.startsWith("Exif\x00\x00")) {
    exifPayload = stringToBytes(exifBytesStr.substring(6));
  } else {
    exifPayload = stringToBytes(exifBytesStr);
  }
  const exifChunkSize = exifPayload.length;
  
  const vp8xPayload = new Uint8Array(10);
  vp8xPayload[0] = vp8xFlags;
  canvasWidth = canvasWidth || 1;
  canvasHeight = canvasHeight || 1;
  vp8xPayload.set(uint24ToBytes(canvasWidth - 1), 4);
  vp8xPayload.set(uint24ToBytes(canvasHeight - 1), 7);
  
  let newFileSize = 4 + 8 + 10;
  const outputChunks: Uint8Array[] = [
    stringToBytes('VP8X'), uint32ToBytes(10), vp8xPayload
  ];
  
  for (const chunk of chunks) {
    outputChunks.push(stringToBytes(chunk.tag));
    outputChunks.push(uint32ToBytes(chunk.payload.length));
    outputChunks.push(chunk.payload);
    if (chunk.payload.length % 2 !== 0) outputChunks.push(new Uint8Array([0]));
    newFileSize += 8 + chunk.payload.length + (chunk.payload.length % 2 !== 0 ? 1 : 0);
  }
  
  outputChunks.push(stringToBytes('EXIF'));
  outputChunks.push(uint32ToBytes(exifChunkSize));
  outputChunks.push(exifPayload);
  if (exifChunkSize % 2 !== 0) outputChunks.push(new Uint8Array([0]));
  newFileSize += 8 + exifChunkSize + (exifChunkSize % 2 !== 0 ? 1 : 0);
  
  const finalBytes = new Uint8Array(8 + newFileSize);
  finalBytes.set(stringToBytes('RIFF'), 0);
  finalBytes.set(uint32ToBytes(newFileSize), 4);
  finalBytes.set(stringToBytes('WEBP'), 8);
  
  let offset = 12;
  for (const part of outputChunks) {
    finalBytes.set(part, offset);
    offset += part.length;
  }
  
  return new Blob([finalBytes], { type: "image/webp" });
}

function uint32ToBytesBE(val: number): Uint8Array {
  return new Uint8Array([(val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff]);
}

function getCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  return table;
}
const crc32Table = getCrc32Table();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function removeEXIfChunksFromPNG(bytes: Uint8Array): Uint8Array {
  const sig = bytes.subarray(0, 8);
  let pos = 8;
  const parts: Uint8Array[] = [sig];

  while (pos < bytes.length) {
    if (pos + 12 > bytes.length) break;
    const len = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    if (len < 0 || pos + 12 + len > bytes.length) break;
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const chunkTotal = 12 + len;
    if (type !== 'eXIf') {
      parts.push(bytes.subarray(pos, pos + chunkTotal));
    }
    pos += chunkTotal;
  }

  const total = parts.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { result.set(p, offset); offset += p.length; }
  return result;
}

async function injectExifIntoPNG(originalFile: File, exifBytesStr: string): Promise<Blob> {
  // Read original PNG bytes directly — no re-encoding, preserves compression and size
  const buffer = await readFileAsArrayBuffer(originalFile);
  let bytes = new Uint8Array(buffer);

  // Remove any existing eXIf chunks before inserting
  bytes = removeEXIfChunksFromPNG(bytes);

  const payloadStr = exifBytesStr.startsWith("Exif\x00\x00") ? exifBytesStr.substring(6) : exifBytesStr;
  const payload = stringToBytes(payloadStr);

  const typeBytes = stringToBytes("eXIf");
  const crcData = new Uint8Array(4 + payload.length);
  crcData.set(typeBytes, 0);
  crcData.set(payload, 4);
  const crc = calculateCrc32(crcData);

  const chunk = new Uint8Array(12 + payload.length);
  chunk.set(uint32ToBytesBE(payload.length), 0);
  chunk.set(crcData, 4);
  chunk.set(uint32ToBytesBE(crc), 4 + crcData.length);

  // Insert after IHDR chunk (8 sig + 4 len + 4 type + 13 data + 4 crc = 33)
  const insertPos = 33;
  if (bytes.length < insertPos) return new Blob([bytes], { type: "image/png" });

  const finalBytes = new Uint8Array(bytes.length + chunk.length);
  finalBytes.set(bytes.subarray(0, insertPos), 0);
  finalBytes.set(chunk, insertPos);
  finalBytes.set(bytes.subarray(insertPos), insertPos + chunk.length);

  return new Blob([finalBytes], { type: "image/png" });
}

export async function addGeotagToImage(
  file: File,
  geotag: GeotagData
): Promise<Blob> {
  const piexif = await getPiexif();
  const fileName = file.name.toLowerCase();
  const isHeic = file.type === "image/heic" || fileName.endsWith(".heic");
  const isPng = file.type === "image/png" || fileName.endsWith(".png");
  const isWebp = file.type === "image/webp" || fileName.endsWith(".webp");

  type ExifData = {
    "0th": Record<number, unknown>;
    "Exif": Record<number, unknown>;
    "GPS": Record<number, unknown>;
    "1st": Record<number, unknown>;
    "thumbnail": string | null;
  };

  // For WebP and PNG: inject EXIF directly into original binary — no canvas re-encoding
  if (isWebp || isPng) {
    let exifData: ExifData = { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": null };

    // Preserve existing EXIF if present
    try {
      const existingExifStr = isWebp
        ? await extractExifBytesFromWebP(file)
        : await extractExifBytesFromPNG(file);
      if (existingExifStr) {
        const loadStr = existingExifStr.startsWith("Exif\x00\x00")
          ? existingExifStr
          : "Exif\x00\x00" + existingExifStr;
        exifData = piexif.load(loadStr);
      }
    } catch {
      // Keep empty exifData
    }

    exifData.GPS = exifData.GPS || {};
    exifData.GPS[piexif.GPSIFD.GPSLatitudeRef] = geotag.latitude >= 0 ? "N" : "S";
    exifData.GPS[piexif.GPSIFD.GPSLatitude] = degToDmsRational(geotag.latitude);
    exifData.GPS[piexif.GPSIFD.GPSLongitudeRef] = geotag.longitude >= 0 ? "E" : "W";
    exifData.GPS[piexif.GPSIFD.GPSLongitude] = degToDmsRational(geotag.longitude);
    exifData.GPS[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    exifData.GPS[29] = `${year}:${month}:${day}`; // GPSDateStamp
    exifData.GPS[7] = [
      [now.getUTCHours(), 1],
      [now.getUTCMinutes(), 1],
      [now.getUTCSeconds(), 1],
    ]; // GPSTimeStamp

    if (geotag.altitude !== undefined && !isNaN(geotag.altitude)) {
      exifData.GPS[piexif.GPSIFD.GPSAltitudeRef] = geotag.altitude >= 0 ? 0 : 1;
      exifData.GPS[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(geotag.altitude) * 100), 100];
    }

    if (geotag.description) {
      exifData["0th"][piexif.ImageIFD.ImageDescription] = geotag.description;
    }
    if (geotag.keywords) {
      const keywordBytes = stringToUtf16Le(geotag.keywords);
      exifData["0th"][0x9C9E] = keywordBytes;
      exifData["0th"][0x9C9F] = keywordBytes;
    }

    const exifBytes = piexif.dump(exifData);
    return isWebp
      ? await injectExifIntoWebP(file, exifBytes)
      : await injectExifIntoPNG(file, exifBytes);
  }

  // JPEG / HEIC path
  let dataUrl: string;
  if (isHeic) {
    const jpegBlob = await convertHeicToJpeg(file);
    dataUrl = await readFileAsDataUrl(new File([jpegBlob], "temp.jpg", { type: "image/jpeg" }));
  } else {
    dataUrl = await readFileAsDataUrl(file);
  }

  let exifData: ExifData;
  try {
    exifData = piexif.load(dataUrl);
  } catch {
    exifData = { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": null };
  }

  const latRef = geotag.latitude >= 0 ? "N" : "S";
  const lngRef = geotag.longitude >= 0 ? "E" : "W";

  exifData.GPS = exifData.GPS || {};
  exifData.GPS[piexif.GPSIFD.GPSLatitudeRef] = latRef;
  exifData.GPS[piexif.GPSIFD.GPSLatitude] = degToDmsRational(geotag.latitude);
  exifData.GPS[piexif.GPSIFD.GPSLongitudeRef] = lngRef;
  exifData.GPS[piexif.GPSIFD.GPSLongitude] = degToDmsRational(geotag.longitude);
  exifData.GPS[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  exifData.GPS[29] = `${year}:${month}:${day}`; // GPSDateStamp
  exifData.GPS[7] = [
    [now.getUTCHours(), 1],
    [now.getUTCMinutes(), 1],
    [now.getUTCSeconds(), 1],
  ]; // GPSTimeStamp

  if (geotag.altitude !== undefined && !isNaN(geotag.altitude)) {
    exifData.GPS[piexif.GPSIFD.GPSAltitudeRef] = geotag.altitude >= 0 ? 0 : 1;
    exifData.GPS[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(geotag.altitude) * 100), 100];
  }

  if (geotag.description) {
    exifData["0th"] = exifData["0th"] || {};
    exifData["0th"][piexif.ImageIFD.ImageDescription] = geotag.description;
  }
  if (geotag.keywords) {
    exifData["0th"] = exifData["0th"] || {};
    const keywordBytes = stringToUtf16Le(geotag.keywords);
    exifData["0th"][0x9C9E] = keywordBytes;
    exifData["0th"][0x9C9F] = keywordBytes;
  }

  const exifBytes = piexif.dump(exifData);
  let newDataUrl: string;
  try {
    newDataUrl = piexif.insert(exifBytes, dataUrl);
  } catch (initialError) {
    // Preserve original bytes whenever possible.  This is deliberately a
    // last-resort path for valid-but-unusual JPEGs from chat/camera software.
    const normalisedDataUrl = await normaliseDecodableImageToJpeg(dataUrl);
    newDataUrl = piexif.insert(exifBytes, normalisedDataUrl);
  }
  return dataUrlToBlob(newDataUrl);
}

export async function verifyGeotaggedBlob(
  blob: Blob,
  expected: GeotagData
): Promise<VerificationResult> {
  try {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    let format: "jpeg" | "png" | "webp" | "unknown" = "unknown";
    let headerValid = false;
    let hasApp1OrExifChunk = false;
    let crcValid: boolean | undefined = undefined;
    const readAscii = (arr: Uint8Array, start: number, len: number) => {
      let s = "";
      for (let i = 0; i < len; i++) s += String.fromCharCode(arr[start + i]);
      return s;
    };

    // Detect format and verify container integrity
    if (bytes.length >= 4 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
      format = "jpeg";
      headerValid = true;
      let pos = 2;
      while (pos + 4 < bytes.length) {
        if (bytes[pos] !== 0xFF) break;
        const marker = bytes[pos + 1];
        if (marker === 0xDA || marker === 0xD9) break; // SOS or EOI
        const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
        if (marker === 0xE1 && pos + 10 <= bytes.length) {
          const id = readAscii(bytes, pos + 4, 6);
          if (id.startsWith("Exif")) {
            hasApp1OrExifChunk = true;
            break;
          }
        }
        pos += 2 + length;
      }
    } else if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A
    ) {
      format = "png";
      headerValid = true;
      let pos = 8;
      while (pos + 12 <= bytes.length) {
        const len = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
        if (len < 0 || pos + 12 + len > bytes.length) break;
        const type = readAscii(bytes, pos + 4, 4);
        if (type === "eXIf") {
          hasApp1OrExifChunk = true;
          const chunkData = bytes.subarray(pos + 4, pos + 8 + len);
          const computedCrc = calculateCrc32(chunkData);
          const storedCrc = view.getUint32(pos + 8 + len, false);
          crcValid = computedCrc === storedCrc;
          break;
        }
        pos += 12 + len;
      }
    } else if (bytes.length >= 12) {
      const riff = readAscii(bytes, 0, 4);
      const webp = readAscii(bytes, 8, 4);
      if (riff === "RIFF" && webp === "WEBP") {
        format = "webp";
        headerValid = true;
        let pos = 12;
        while (pos + 8 <= bytes.length) {
          const tag = readAscii(bytes, pos, 4);
          const size = view.getUint32(pos + 4, true);
          if (tag === "EXIF") {
            hasApp1OrExifChunk = true;
            break;
          }
          const paddedSize = size % 2 !== 0 ? size + 1 : size;
          pos += 8 + paddedSize;
        }
      }
    }

    if (!headerValid) {
      return {
        isValid: false,
        format: "unknown",
        coordinatesVerified: false,
        diffLatDegrees: 0,
        diffLngDegrees: 0,
        diffMeters: 0,
        error: "Corrupted image header or unrecognized image container format.",
        details: { hasApp1OrExifChunk, hasGpsIfd: false, headerValid },
      };
    }

    // Re-read and extract GPS directly from the generated blob
    const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;
    const dataUrl = await readFileAsDataUrl(new File([blob], `verify.${format}`, { type: mimeType }));
    const extracted = await extractExistingGps(dataUrl);

    if (!extracted) {
      return {
        isValid: false,
        format,
        coordinatesVerified: false,
        diffLatDegrees: 0,
        diffLngDegrees: 0,
        diffMeters: 0,
        error: "Verification failed: GPS metadata chunk was not detected in output binary.",
        details: { hasApp1OrExifChunk, hasGpsIfd: false, headerValid, crcValid },
      };
    }

    const diffLat = Math.abs(extracted.lat - expected.latitude);
    const diffLng = Math.abs(extracted.lng - expected.longitude);
    const distanceMeters = calculateDistanceMeters(extracted.lat, extracted.lng, expected.latitude, expected.longitude);

    // Tolerance check: standard rational EXIF format has precision of 0.01 seconds (~0.3m)
    // We allow up to 5 meters / 0.0001 degrees
    const coordsMatch = distanceMeters <= 5.0 || (diffLat < 0.0001 && diffLng < 0.0001);

    let altMatch: boolean | undefined = undefined;
    if (expected.altitude !== undefined) {
      if (extracted.altitude !== undefined) {
        altMatch = Math.abs(extracted.altitude - expected.altitude) <= 1.5;
      } else {
        altMatch = false;
      }
    }

    const isFullyValid = coordsMatch && (altMatch === undefined || altMatch) && (crcValid === undefined || crcValid);

    return {
      isValid: isFullyValid,
      format,
      coordinatesVerified: coordsMatch,
      extractedGps: extracted,
      diffLatDegrees: diffLat,
      diffLngDegrees: diffLng,
      diffMeters: distanceMeters,
      altitudeVerified: altMatch,
      details: {
        hasApp1OrExifChunk,
        hasGpsIfd: true,
        headerValid,
        crcValid,
      },
      error: isFullyValid ? undefined : "Output coordinates or container CRC did not match expected values.",
    };
  } catch (err: any) {
    return {
      isValid: false,
      format: "unknown",
      coordinatesVerified: false,
      diffLatDegrees: 0,
      diffLngDegrees: 0,
      diffMeters: 0,
      error: `Verification error: ${err.message || err}`,
    };
  }
}

export async function addGeotagAndVerify(
  file: File,
  geotag: GeotagData
): Promise<{ blob: Blob; verification: VerificationResult }> {
  const blob = await addGeotagToImage(file, geotag);
  const verification = await verifyGeotaggedBlob(blob, geotag);
  return { blob, verification };
}

export async function downloadGeotaggedImage(blob: Blob, originalName: string): Promise<void> {
  const { saveAs } = await import("file-saver");
  const extensionMatch = originalName.match(/\.([^/.]+)$/);
  const originalExt = extensionMatch ? extensionMatch[1].toLowerCase() : "jpg";
  const validExt = originalExt === "heic" ? "jpg" : originalExt;
  
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const newName = `${baseName}_geotagged.${validExt}`;

  saveAs(blob, newName);
}

export async function downloadAsZip(files: { name: string; blob: Blob }[]): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const { saveAs } = await import("file-saver");
  const zip = new JSZip();

  files.forEach((file) => {
    const extensionMatch = file.name.match(/\.([^/.]+)$/);
    const originalExt = extensionMatch ? extensionMatch[1].toLowerCase() : "jpg";
    const validExt = originalExt === "heic" ? "jpg" : originalExt;

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const newName = `${baseName}_geotagged.${validExt}`;
    zip.file(newName, file.blob);
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "geotagged_images.zip");
}

export async function reverseGeocode(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const results = await geocoder.search(query);
  if (results && results.length > 0) {
    return {
      lat: results[0].lat,
      lng: results[0].lng,
      displayName: results[0].displayName,
    };
  }
  return null;
}

export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const result = await geocoder.reverse(lat, lng);
  if (result) {
    return {
      lat: result.lat,
      lng: result.lng,
      displayName: result.displayName,
    };
  }
  return null;
}

export async function searchPlaces(
  query: string
): Promise<PlaceSuggestion[]> {
  return await geocoder.search(query);
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
