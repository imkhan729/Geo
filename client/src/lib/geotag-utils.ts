import piexif from "piexifjs";
import heic2any from "heic2any";
import { saveAs } from "file-saver";

export interface GeotagData {
  latitude: number;
  longitude: number;
  keywords?: string;
  description?: string;
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

export async function addGeotagToImage(
  file: File,
  geotag: GeotagData
): Promise<Blob> {
  let processedFile = file;
  let isHeic = false;
  
  if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
    isHeic = true;
    const jpegBlob = await convertHeicToJpeg(file);
    processedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg"
    });
  }
  
  const dataUrl = await readFileAsDataUrl(processedFile);
  
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
  
  const exifBytes = piexif.dump(exifData);
  const newDataUrl = piexif.insert(exifBytes, dataUrl);
  
  const base64 = newDataUrl.split(",")[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new Blob([array], { type: isHeic ? "image/jpeg" : processedFile.type });
}

export function downloadGeotaggedImage(blob: Blob, originalName: string): void {
  const extension = originalName.toLowerCase().endsWith(".heic") ? ".jpg" : "";
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const newExtension = extension || originalName.match(/\.[^/.]+$/)?.[0] || ".jpg";
  const newName = `${baseName}_geotagged${newExtension}`;
  
  saveAs(blob, newName);
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

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
