/**
 * GPS Coordinate Conversion & Smart Parsing Engine
 * Supports Decimal Degrees (DD), Degrees Minutes Seconds (DMS),
 * Degrees Decimal Minutes (DDM), Geohash, Haversine distance, and multi-format parsing.
 * 100% client-side memory execution with zero telemetry leaks.
 */

export interface DmsCoordinate {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: "N" | "S" | "E" | "W";
  formatted: string;
}

export interface DdmCoordinate {
  degrees: number;
  decimalMinutes: number;
  direction: "N" | "S" | "E" | "W";
  formatted: string;
}

export interface ConvertedCoordinates {
  dd: {
    lat: number;
    lng: number;
    formatted: string;
  };
  dms: {
    lat: DmsCoordinate;
    lng: DmsCoordinate;
    formatted: string;
  };
  ddm: {
    lat: DdmCoordinate;
    lng: DdmCoordinate;
    formatted: string;
  };
  geohash: string;
  urls: {
    googleMaps: string;
    openStreetMap: string;
    appleMaps: string;
    geoUri: string;
  };
}

export interface ParseResult {
  success: boolean;
  lat?: number;
  lng?: number;
  detectedFormat?: string;
  error?: string;
}

// Base32 alphabet used in standard Geohash algorithms (Morton order)
const GEOHASH_ALPHABET = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Convert a decimal coordinate into Degrees, Minutes, Seconds (DMS)
 */
export function decimalToDms(val: number, isLat: boolean): DmsCoordinate {
  const abs = Math.abs(val);
  const degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = Number(((minutesFull - minutes) * 60).toFixed(2));

  // Handle rounding edge case (e.g. 59.999s rounding up to 60s)
  let adjSec = seconds;
  let adjMin = minutes;
  let adjDeg = degrees;
  if (adjSec >= 60) {
    adjSec = 0;
    adjMin += 1;
  }
  if (adjMin >= 60) {
    adjMin = 0;
    adjDeg += 1;
  }

  const direction: "N" | "S" | "E" | "W" = isLat
    ? val >= 0
      ? "N"
      : "S"
    : val >= 0
      ? "E"
      : "W";

  const formatted = `${adjDeg}° ${adjMin}' ${adjSec.toFixed(2)}" ${direction}`;

  return {
    degrees: adjDeg,
    minutes: adjMin,
    seconds: adjSec,
    direction,
    formatted,
  };
}

/**
 * Convert Degrees, Minutes, Seconds (DMS) into a decimal coordinate
 */
export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: "N" | "S" | "E" | "W"
): number {
  const sign = direction === "S" || direction === "W" ? -1 : 1;
  const dec = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  return sign * dec;
}

/**
 * Convert a decimal coordinate into Degrees Decimal Minutes (DDM - nautical / GPS standard)
 */
export function decimalToDdm(val: number, isLat: boolean): DdmCoordinate {
  const abs = Math.abs(val);
  const degrees = Math.floor(abs);
  const decimalMinutes = Number(((abs - degrees) * 60).toFixed(4));

  let adjMin = decimalMinutes;
  let adjDeg = degrees;
  if (adjMin >= 60) {
    adjMin = 0;
    adjDeg += 1;
  }

  const direction: "N" | "S" | "E" | "W" = isLat
    ? val >= 0
      ? "N"
      : "S"
    : val >= 0
      ? "E"
      : "W";

  const formatted = `${adjDeg}° ${adjMin.toFixed(4)}' ${direction}`;

  return {
    degrees: adjDeg,
    decimalMinutes: adjMin,
    direction,
    formatted,
  };
}

/**
 * Convert Degrees Decimal Minutes (DDM) into a decimal coordinate
 */
export function ddmToDecimal(
  degrees: number,
  decimalMinutes: number,
  direction: "N" | "S" | "E" | "W"
): number {
  const sign = direction === "S" || direction === "W" ? -1 : 1;
  const dec = Math.abs(degrees) + decimalMinutes / 60;
  return sign * dec;
}

/**
 * Encode latitude and longitude into standard Base32 Geohash string
 */
export function encodeGeohash(lat: number, lng: number, precision = 9): string {
  if (isNaN(lat) || isNaN(lng)) return "";
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return "";

  let latMin = -90.0;
  let latMax = 90.0;
  let lngMin = -180.0;
  let lngMax = 180.0;

  let geohash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        ch |= 1 << (4 - bit);
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += GEOHASH_ALPHABET[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Decode Base32 Geohash string into latitude and longitude center point
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number } | null {
  if (!geohash || typeof geohash !== "string") return null;
  const hash = geohash.toLowerCase().trim();
  if (hash.length === 0) return null;

  let latMin = -90.0;
  let latMax = 90.0;
  let lngMin = -180.0;
  let lngMax = 180.0;
  let isEven = true;

  for (let i = 0; i < hash.length; i++) {
    const c = hash[i];
    const cd = GEOHASH_ALPHABET.indexOf(c);
    if (cd === -1) return null;

    for (let j = 4; j >= 0; j--) {
      const bit = (cd >> j) & 1;
      if (isEven) {
        const mid = (lngMin + lngMax) / 2;
        if (bit === 1) {
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (bit === 1) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return {
    lat: Number(((latMin + latMax) / 2).toFixed(6)),
    lng: Number(((lngMin + lngMax) / 2).toFixed(6)),
  };
}

/**
 * Calculate Great-Circle distance (Haversine formula) and initial bearing between two points
 */
export function calculateDistanceAndBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { distanceKm: number; distanceMiles: number; bearingDeg: number } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Number((R * c).toFixed(2));
  const distanceMiles = Number((distanceKm * 0.621371).toFixed(2));

  // Initial bearing
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  let bearingDeg = Math.round((toDeg(Math.atan2(y, x)) + 360) % 360);

  return { distanceKm, distanceMiles, bearingDeg };
}

/**
 * Convert a pair of Decimal coordinates into all supported formats and map links
 */
export function convertAllFormats(lat: number, lng: number, precision = 6): ConvertedCoordinates {
  const boundedLat = Math.max(-90, Math.min(90, lat));
  const boundedLng = Math.max(-180, Math.min(180, lng));

  const dmsLat = decimalToDms(boundedLat, true);
  const dmsLng = decimalToDms(boundedLng, false);

  const ddmLat = decimalToDdm(boundedLat, true);
  const ddmLng = decimalToDdm(boundedLng, false);

  const geohash = encodeGeohash(boundedLat, boundedLng, 9);

  return {
    dd: {
      lat: Number(boundedLat.toFixed(precision)),
      lng: Number(boundedLng.toFixed(precision)),
      formatted: `${boundedLat.toFixed(precision)}, ${boundedLng.toFixed(precision)}`,
    },
    dms: {
      lat: dmsLat,
      lng: dmsLng,
      formatted: `${dmsLat.formatted}, ${dmsLng.formatted}`,
    },
    ddm: {
      lat: ddmLat,
      lng: ddmLng,
      formatted: `${ddmLat.formatted}, ${ddmLng.formatted}`,
    },
    geohash,
    urls: {
      googleMaps: `https://www.google.com/maps?q=${boundedLat.toFixed(6)},${boundedLng.toFixed(6)}`,
      openStreetMap: `https://www.openstreetmap.org/?mlat=${boundedLat.toFixed(6)}&mlon=${boundedLng.toFixed(6)}#map=16/${boundedLat.toFixed(6)}/${boundedLng.toFixed(6)}`,
      appleMaps: `https://maps.apple.com/?ll=${boundedLat.toFixed(6)},${boundedLng.toFixed(6)}&q=Pin`,
      geoUri: `geo:${boundedLat.toFixed(6)},${boundedLng.toFixed(6)}`,
    },
  };
}

/**
 * Validate latitude [-90, 90] and longitude [-180, 180]
 */
export function isValidCoords(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Universal Smart Coordinate Parser:
 * Accepts arbitrary user input (clean DD, spaced DD, DMS with unicode symbols,
 * DDM nautical, Google Maps URLs, OpenStreetMap URLs, Geohashes, or Geo URIs)
 * and extracts validated latitude and longitude.
 */
export function parseAnyCoordinates(rawInput: string): ParseResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { success: false, error: "Please enter coordinate text or a map link." };
  }

  const input = rawInput.trim();

  // 1. Google Maps URL detection
  const gmapAtMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (gmapAtMatch) {
    const lat = parseFloat(gmapAtMatch[1]);
    const lng = parseFloat(gmapAtMatch[2]);
    if (isValidCoords(lat, lng)) {
      return { success: true, lat, lng, detectedFormat: "Google Maps URL (@coordinates)" };
    }
  }

  const gmapQMatch = input.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (gmapQMatch) {
    const lat = parseFloat(gmapQMatch[1]);
    const lng = parseFloat(gmapQMatch[2]);
    if (isValidCoords(lat, lng)) {
      return { success: true, lat, lng, detectedFormat: "Google Maps URL (?q=coordinates)" };
    }
  }

  // 2. OpenStreetMap URL detection
  const osmMapMatch = input.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
  if (osmMapMatch) {
    const lat = parseFloat(osmMapMatch[1]);
    const lng = parseFloat(osmMapMatch[2]);
    if (isValidCoords(lat, lng)) {
      return { success: true, lat, lng, detectedFormat: "OpenStreetMap URL" };
    }
  }

  const osmQueryMatch = input.match(/mlat=(-?\d+\.\d+)[&]mlon=(-?\d+\.\d+)/);
  if (osmQueryMatch) {
    const lat = parseFloat(osmQueryMatch[1]);
    const lng = parseFloat(osmQueryMatch[2]);
    if (isValidCoords(lat, lng)) {
      return { success: true, lat, lng, detectedFormat: "OpenStreetMap Query URL" };
    }
  }

  // 3. Geo URI detection (geo:37.774929,-122.419416)
  const geoUriMatch = input.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (geoUriMatch) {
    const lat = parseFloat(geoUriMatch[1]);
    const lng = parseFloat(geoUriMatch[2]);
    if (isValidCoords(lat, lng)) {
      return { success: true, lat, lng, detectedFormat: "Geo URI" };
    }
  }

  // 4. Geohash detection (single word, 4-12 characters, all in geohash alphabet)
  if (/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,12}$/i.test(input)) {
    const decoded = decodeGeohash(input);
    if (decoded && isValidCoords(decoded.lat, decoded.lng)) {
      return { success: true, lat: decoded.lat, lng: decoded.lng, detectedFormat: "Geohash Code" };
    }
  }

  // 5. Standard Decimal Degrees: "37.774929, -122.419416" or "37.774929 -122.419416"
  const ddMatch = input.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (ddMatch) {
    const lat = parseFloat(ddMatch[1]);
    const lng = parseFloat(ddMatch[2]);
    if (isValidCoords(lat, lng)) {
      return { success: true, lat, lng, detectedFormat: "Decimal Degrees (DD)" };
    }
  }

  // 6. DMS with Hemisphere Indicators:
  // e.g. 37° 46' 29.74" N, 122° 25' 09.90" W
  // or 37°46'29.74"N 122°25'9.9"W
  // or N 37 46 29.74, W 122 25 9.9
  const dmsPattern =
    /(?:([NSns])\s*)?(\d{1,2})[°\s]+(\d{1,2})['′\s]+(\d{1,2}(?:\.\d+)?)[″"\s]*(?:([NSns]))?[,\s]+(?:([EWew])\s*)?(\d{1,3})[°\s]+(\d{1,2})['′\s]+(\d{1,2}(?:\.\d+)?)[″"\s]*(?:([EWew]))?/;
  const dmsMatch = input.match(dmsPattern);
  if (dmsMatch) {
    const latDir = (dmsMatch[1] || dmsMatch[5] || "N").toUpperCase() as "N" | "S";
    const latDeg = parseInt(dmsMatch[2], 10);
    const latMin = parseInt(dmsMatch[3], 10);
    const latSec = parseFloat(dmsMatch[4]);

    const lngDir = (dmsMatch[6] || dmsMatch[10] || "E").toUpperCase() as "E" | "W";
    const lngDeg = parseInt(dmsMatch[7], 10);
    const lngMin = parseInt(dmsMatch[8], 10);
    const lngSec = parseFloat(dmsMatch[9]);

    const lat = dmsToDecimal(latDeg, latMin, latSec, latDir);
    const lng = dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);

    if (isValidCoords(lat, lng)) {
      return { success: true, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), detectedFormat: "Degrees Minutes Seconds (DMS)" };
    }
  }

  // 7. DDM (Degrees Decimal Minutes)
  // e.g. 37° 46.4957' N, 122° 25.1650' W
  const ddmPattern =
    /(?:([NSns])\s*)?(\d{1,2})[°\s]+(\d{1,2}(?:\.\d+)?)['′\s]*(?:([NSns]))?[,\s]+(?:([EWew])\s*)?(\d{1,3})[°\s]+(\d{1,2}(?:\.\d+)?)['′\s]*(?:([EWew]))?/;
  const ddmMatch = input.match(ddmPattern);
  if (ddmMatch) {
    const latDir = (ddmMatch[1] || ddmMatch[4] || "N").toUpperCase() as "N" | "S";
    const latDeg = parseInt(ddmMatch[2], 10);
    const latMin = parseFloat(ddmMatch[3]);

    const lngDir = (ddmMatch[5] || ddmMatch[8] || "E").toUpperCase() as "E" | "W";
    const lngDeg = parseInt(ddmMatch[6], 10);
    const lngMin = parseFloat(ddmMatch[7]);

    const lat = ddmToDecimal(latDeg, latMin, latDir);
    const lng = ddmToDecimal(lngDeg, lngMin, lngDir);

    if (isValidCoords(lat, lng)) {
      return { success: true, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), detectedFormat: "Degrees Decimal Minutes (DDM)" };
    }
  }

  return {
    success: false,
    error: "Could not detect valid coordinates. Try formats like '37.7749, -122.4194' or '37° 46\' 29.7\" N, 122° 25\' 9.9\" W'.",
  };
}
