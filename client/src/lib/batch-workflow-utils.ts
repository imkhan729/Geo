/**
 * Batch Workflow Utilities — FreeGeoTagger
 * Advanced batch geotagging, CSV coordinate mapping, and bulk export.
 * 100% client-side memory execution (Zero-Upload Invariant).
 */

export interface CsvCoordinateRow {
  filename: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  description?: string;
  matched?: boolean;
}

export interface CsvParseResult {
  rows: CsvCoordinateRow[];
  errors: string[];
  delimiter: string;
  totalParsed: number;
  validCount: number;
}

/**
 * Detects the most probable delimiter for a CSV string (comma, semicolon, tab).
 */
export function detectDelimiter(csvText: string): string {
  const firstLine = csvText.split(/\r?\n/)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  if (semicolonCount > commaCount) return ";";
  return ",";
}

/**
 * Parses coordinate CSV / TSV text and validates rows against WGS84 bounds.
 */
export function parseCoordinateCsv(csvText: string): CsvParseResult {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return { rows: [], errors: ["CSV file is empty."], delimiter: ",", totalParsed: 0, validCount: 0 };
  }

  const delimiter = detectDelimiter(trimmed);
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["CSV must contain a header row and at least one data row."],
      delimiter,
      totalParsed: 0,
      validCount: 0,
    };
  }

  // Parse header
  const rawHeaders = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase().trim().replace(/^["']|["']$/g, ""));

  const filenameIdx = rawHeaders.findIndex((h) => ["filename", "file", "name", "photo", "image", "img"].includes(h));
  const latIdx = rawHeaders.findIndex((h) => ["latitude", "lat", "y"].includes(h));
  const lngIdx = rawHeaders.findIndex((h) => ["longitude", "lng", "lon", "long", "x"].includes(h));
  const altIdx = rawHeaders.findIndex((h) => ["altitude", "alt", "elevation", "ele"].includes(h));
  const descIdx = rawHeaders.findIndex((h) => ["description", "desc", "caption", "title", "comment"].includes(h));

  if (filenameIdx === -1 || latIdx === -1 || lngIdx === -1) {
    const missing: string[] = [];
    if (filenameIdx === -1) missing.push("filename");
    if (latIdx === -1) missing.push("latitude (or lat)");
    if (lngIdx === -1) missing.push("longitude (or lng/lon)");

    return {
      rows: [],
      errors: [`Missing required CSV column header(s): ${missing.join(", ")}.`],
      delimiter,
      totalParsed: 0,
      validCount: 0,
    };
  }

  const rows: CsvCoordinateRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    if (cols.length <= Math.max(filenameIdx, latIdx, lngIdx)) {
      errors.push(`Row ${i + 1}: Insufficient columns (found ${cols.length}).`);
      continue;
    }

    const filename = cols[filenameIdx]?.trim().replace(/^["']|["']$/g, "") || "";
    const rawLat = cols[latIdx]?.trim().replace(/^["']|["']$/g, "") || "";
    const rawLng = cols[lngIdx]?.trim().replace(/^["']|["']$/g, "") || "";

    if (!filename) {
      errors.push(`Row ${i + 1}: Empty filename.`);
      continue;
    }

    const lat = parseFloat(rawLat);
    const lng = parseFloat(rawLng);

    if (isNaN(lat) || isNaN(lng)) {
      errors.push(`Row ${i + 1} (${filename}): Invalid numeric coordinates (${rawLat}, ${rawLng}).`);
      continue;
    }

    if (lat < -90 || lat > 90) {
      errors.push(`Row ${i + 1} (${filename}): Latitude ${lat} out of range (-90 to +90).`);
      continue;
    }

    if (lng < -180 || lng > 180) {
      errors.push(`Row ${i + 1} (${filename}): Longitude ${lng} out of range (-180 to +180).`);
      continue;
    }

    let altitude: number | undefined;
    if (altIdx !== -1 && cols[altIdx]) {
      const parsedAlt = parseFloat(cols[altIdx].trim().replace(/^["']|["']$/g, ""));
      if (!isNaN(parsedAlt)) {
        altitude = parsedAlt;
      }
    }

    let description: string | undefined;
    if (descIdx !== -1 && cols[descIdx]) {
      description = cols[descIdx].trim().replace(/^["']|["']$/g, "");
    }

    rows.push({
      filename,
      latitude: lat,
      longitude: lng,
      altitude,
      description,
    });
  }

  return {
    rows,
    errors,
    delimiter,
    totalParsed: lines.length - 1,
    validCount: rows.length,
  };
}

/**
 * Splits a single CSV line taking quotes into account.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }
  result.push(current);

  return result;
}

/**
 * Matches CSV coordinate rows to a list of loaded image filenames.
 * Supports exact match, case-insensitive match, and extension-agnostic match.
 */
export function matchCsvToImages<T extends { name: string }>(
  csvRows: CsvCoordinateRow[],
  images: T[]
): Map<T, CsvCoordinateRow> {
  const matchMap = new Map<T, CsvCoordinateRow>();

  const normalize = (name: string) => name.toLowerCase().trim();
  const stripExt = (name: string) => normalize(name).replace(/\.[^/.]+$/, "");

  const exactMap = new Map<string, T>();
  const lowerMap = new Map<string, T>();
  const baseNameMap = new Map<string, T>();

  for (const img of images) {
    exactMap.set(img.name, img);
    lowerMap.set(normalize(img.name), img);
    baseNameMap.set(stripExt(img.name), img);
  }

  for (const row of csvRows) {
    let target = exactMap.get(row.filename);
    if (!target) {
      target = lowerMap.get(normalize(row.filename));
    }
    if (!target) {
      target = baseNameMap.get(stripExt(row.filename));
    }

    if (target && !matchMap.has(target)) {
      matchMap.set(target, row);
      row.matched = true;
    }
  }

  return matchMap;
}

/**
 * Generates an exportable CSV summary log of all batch-tagged images.
 */
export function generateBatchExportCsv(
  items: Array<{
    filename: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    description?: string;
    status: string;
    verificationStatus?: string;
  }>
): string {
  const headers = ["Filename", "Latitude", "Longitude", "Altitude", "Description", "Status", "Verification"];
  const rows = items.map((item) => {
    const lat = item.latitude !== undefined ? item.latitude.toFixed(6) : "";
    const lng = item.longitude !== undefined ? item.longitude.toFixed(6) : "";
    const alt = item.altitude !== undefined ? item.altitude.toFixed(1) : "";
    const desc = item.description ? `"${item.description.replace(/"/g, '""')}"` : "";
    const name = `"${item.filename.replace(/"/g, '""')}"`;
    const status = item.status;
    const verif = item.verificationStatus || "Unverified";

    return [name, lat, lng, alt, desc, status, verif].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Formats output filename based on a configurable pattern.
 */
export function formatBatchFilename(
  originalName: string,
  pattern: string,
  index: number,
  lat?: number,
  lng?: number
): string {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
  const ext = dotIndex !== -1 ? originalName.substring(dotIndex + 1) : "jpg";

  if (!pattern || pattern.trim() === "") {
    return originalName;
  }

  let formatted = pattern
    .replace(/\{name\}/g, baseName)
    .replace(/\{ext\}/g, ext)
    .replace(/\{index\}/g, String(index))
    .replace(/\{lat\}/g, lat !== undefined ? lat.toFixed(4) : "0.0000")
    .replace(/\{lng\}/g, lng !== undefined ? lng.toFixed(4) : "0.0000");

  if (!formatted.endsWith(`.${ext}`)) {
    formatted = `${formatted}.${ext}`;
  }

  return formatted;
}
