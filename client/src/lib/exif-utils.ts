import ExifReader from 'exifreader';

export interface ExifData {
  gps: {
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
  };
  dateTime: string | null;
  camera: {
    make: string | null;
    model: string | null;
  };
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
}

export interface ExifResult {
  success: boolean;
  hasGps: boolean;
  data: ExifData | null;
  error: string | null;
  rawTags: Record<string, unknown> | null;
}

function convertDMSToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: string
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

function getGpsValue(tag: unknown): number | null {
  if (tag && typeof tag === 'object' && 'value' in tag) {
    const val = (tag as { value: unknown }).value;
    if (typeof val === 'number') return val;
    if (Array.isArray(val) && val.length === 3) {
      return convertDMSToDecimal(val[0], val[1], val[2], '');
    }
  }
  return null;
}

function getStringValue(tag: unknown): string | null {
  if (!tag) return null;
  if (typeof tag === 'object' && 'description' in tag) {
    return String((tag as { description: unknown }).description);
  }
  if (typeof tag === 'object' && 'value' in tag) {
    return String((tag as { value: unknown }).value);
  }
  return null;
}

function getNumberValue(tag: unknown): number | null {
  if (!tag) return null;
  if (typeof tag === 'object' && 'value' in tag) {
    const val = (tag as { value: unknown }).value;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || null;
  }
  return null;
}

export async function extractExifData(file: File): Promise<ExifResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = await ExifReader.load(arrayBuffer, { expanded: true });
    
    let latitude: number | null = null;
    let longitude: number | null = null;
    let altitude: number | null = null;

    if (tags.gps) {
      if (tags.gps.Latitude !== undefined) {
        latitude = tags.gps.Latitude;
      }
      if (tags.gps.Longitude !== undefined) {
        longitude = tags.gps.Longitude;
      }
      if (tags.gps.Altitude !== undefined) {
        altitude = typeof tags.gps.Altitude === 'number' ? tags.gps.Altitude : null;
      }
    }

    const exif = tags.exif || {};
    const image = tags.file || tags.image || {};
    
    const exifData: ExifData = {
      gps: {
        latitude,
        longitude,
        altitude,
      },
      dateTime: getStringValue(exif.DateTimeOriginal) || 
                getStringValue(exif.DateTime) || 
                getStringValue(exif.DateTimeDigitized) || null,
      camera: {
        make: getStringValue(exif.Make) || getStringValue((tags as Record<string, unknown>).Make) || null,
        model: getStringValue(exif.Model) || getStringValue((tags as Record<string, unknown>).Model) || null,
      },
      image: {
        width: getNumberValue(exif.PixelXDimension) || 
               getNumberValue(image['Image Width']) || 
               getNumberValue((tags as Record<string, unknown>).ImageWidth) || null,
        height: getNumberValue(exif.PixelYDimension) || 
                getNumberValue(image['Image Height']) || 
                getNumberValue((tags as Record<string, unknown>).ImageHeight) || null,
        orientation: getStringValue(exif.Orientation) || null,
      },
      software: getStringValue(exif.Software) || null,
      exposureTime: getStringValue(exif.ExposureTime) || null,
      fNumber: getStringValue(exif.FNumber) || null,
      iso: getNumberValue(exif.ISOSpeedRatings) || null,
      focalLength: getStringValue(exif.FocalLength) || null,
      flash: getStringValue(exif.Flash) || null,
    };

    const hasGps = latitude !== null && longitude !== null;

    return {
      success: true,
      hasGps,
      data: exifData,
      error: null,
      rawTags: tags as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return {
      success: false,
      hasGps: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to read EXIF data',
      rawTags: null,
    };
  }
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
}

export function formatCoordinatesDecimal(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
