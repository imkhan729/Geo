import piexif from "piexifjs";
import heic2any from "heic2any";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export interface GeotagData {
  latitude: number;
  longitude: number;
  keywords?: string;
  description?: string;
}

export interface PlaceSuggestion {
  lat: number;
  lng: number;
  displayName: string;
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  type: string;
  size: number;
  existingGps?: { lat: number; lng: number } | null;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

function degToDmsRational(deg: number): [[number, number], [number, number], [number, number]] {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60 * 100);

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100]
  ];
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95
  });

  return Array.isArray(result) ? result[0] : result;
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function extractExistingGps(dataUrl: string): { lat: number; lng: number } | null {
  try {
    let exifPayload = dataUrl;

    if (dataUrl.startsWith("data:image/png")) {
      const base64 = dataUrl.split(',')[1];
      const binaryStr = window.atob(base64);
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
      if (!found) return null;
    } else if (dataUrl.startsWith("data:image/webp")) {
      const base64 = dataUrl.split(',')[1];
      const binaryStr = window.atob(base64);
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
      if (!found) return null;
    }

    const exifData = piexif.load(exifPayload);
    const gpsData = exifData.GPS;

    if (!gpsData || !gpsData[piexif.GPSIFD.GPSLatitude] || !gpsData[piexif.GPSIFD.GPSLongitude]) {
      return null;
    }

    const latDms = gpsData[piexif.GPSIFD.GPSLatitude] as [[number, number], [number, number], [number, number]];
    const latRef = gpsData[piexif.GPSIFD.GPSLatitudeRef] as string;
    const lngDms = gpsData[piexif.GPSIFD.GPSLongitude] as [[number, number], [number, number], [number, number]];
    const lngRef = gpsData[piexif.GPSIFD.GPSLongitudeRef] as string;

    const lat = dmsToDecimal(latDms, latRef);
    const lng = dmsToDecimal(lngDms, lngRef);

    return { lat, lng };
  } catch {
    return null;
  }
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

function dmsToDecimal(dms: [[number, number], [number, number], [number, number]], ref: string): number {
  const degrees = dms[0][0] / dms[0][1];
  const minutes = dms[1][0] / dms[1][1];
  const seconds = dms[2][0] / dms[2][1];

  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (ref === "S" || ref === "W") {
    decimal = -decimal;
  }

  return decimal;
}

async function convertToJpeg(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not convert to JPEG"));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            resolve({ blob, dataUrl: reader.result as string });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
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
  const fileName = file.name.toLowerCase();
  const isHeic = file.type === "image/heic" || fileName.endsWith(".heic");
  const isPng = file.type === "image/png" || fileName.endsWith(".png");
  const isWebp = file.type === "image/webp" || fileName.endsWith(".webp");
  const needsConversion = isHeic || isPng || isWebp;

  let dataUrl: string;

  if (isHeic) {
    const jpegBlob = await convertHeicToJpeg(file);
    dataUrl = await readFileAsDataUrl(new File([jpegBlob], "temp.jpg", { type: "image/jpeg" }));
  } else if (isPng || isWebp) {
    const converted = await convertToJpeg(file);
    dataUrl = converted.dataUrl;
  } else {
    dataUrl = await readFileAsDataUrl(file);
  }

  let exifData: {
    "0th": Record<number, unknown>;
    "Exif": Record<number, unknown>;
    "GPS": Record<number, unknown>;
    "1st": Record<number, unknown>;
    "thumbnail": string | null;
  };

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
  const newDataUrl = piexif.insert(exifBytes, dataUrl);

  const response = await fetch(newDataUrl);
  const blob = await response.blob();

  if (isWebp) {
    try {
      return await injectExifIntoWebP(file, exifBytes);
    } catch (e) {
      console.error("Failed to inject EXIF into WebP, falling back to JPEG", e);
      return blob;
    }
  } else if (isPng) {
    try {
      return await injectExifIntoPNG(file, exifBytes);
    } catch (e) {
      console.error("Failed to inject EXIF into PNG, falling back to JPEG", e);
      return blob;
    }
  }

  return blob;
}

export function downloadGeotaggedImage(blob: Blob, originalName: string): void {
  const extensionMatch = originalName.match(/\.([^/.]+)$/);
  const originalExt = extensionMatch ? extensionMatch[1].toLowerCase() : "jpg";
  const validExt = originalExt === "heic" ? "jpg" : originalExt;
  
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const newName = `${baseName}_geotagged.${validExt}`;

  saveAs(blob, newName);
}

export async function downloadAsZip(files: { name: string; blob: Blob }[]): Promise<void> {
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
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "User-Agent": "FreeGeoTagger/1.0"
        }
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function searchPlaces(
  query: string
): Promise<PlaceSuggestion[]> {
  try {
    if (!query || query.length < 3) return [];

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          "User-Agent": "FreeGeoTagger/1.0"
        }
      }
    );

    const data = await response.json();

    if (data && Array.isArray(data)) {
      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name
      }));
    }

    return [];
  } catch {
    return [];
  }
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
