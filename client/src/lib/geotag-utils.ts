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
    const exifData = piexif.load(dataUrl);
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

  return blob;
}

export function downloadGeotaggedImage(blob: Blob, originalName: string): void {
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const newName = `${baseName}_geotagged.jpg`;

  saveAs(blob, newName);
}

export async function downloadAsZip(files: { name: string; blob: Blob }[]): Promise<void> {
  const zip = new JSZip();

  files.forEach((file) => {
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const newName = `${baseName}_geotagged.jpg`;
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
