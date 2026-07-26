/**
 * Build-time guard for SERP metadata.
 *
 * Titles must render inside Google's ~580px limit and descriptions inside ~160 chars,
 * or they get truncated with an ellipsis and lose the keyword/benefit at the end.
 * This runs as part of `npm run build` and FAILS the build on any violation, so
 * out-of-range metadata can never ship.
 *
 * Also enforces global uniqueness — two pages sharing a title or description makes
 * Google pick one arbitrarily and suppress the other.
 */
import { SEO_CONFIG } from "../client/src/lib/seo";

export const TITLE_MIN = 50;
export const TITLE_MAX = 60;
export const DESC_MIN = 140;
export const DESC_MAX = 160;

export type MetaRow = {
  key: string;
  url: string;
  title: string;
  titleLen: number;
  titleStatus: string;
  description: string;
  descLen: number;
  descStatus: string;
  ok: boolean;
};

function rangeStatus(len: number, min: number, max: number) {
  if (len < min) return `TOO SHORT (${min - len} under)`;
  if (len > max) return `TOO LONG (${len - max} over)`;
  return "PASS";
}

export function checkMeta(): { rows: MetaRow[]; errors: string[] } {
  const rows: MetaRow[] = [];
  const errors: string[] = [];

  for (const [key, cfg] of Object.entries(SEO_CONFIG)) {
    const title = cfg.title;
    const description = cfg.description;
    const titleStatus = rangeStatus(title.length, TITLE_MIN, TITLE_MAX);
    const descStatus = rangeStatus(description.length, DESC_MIN, DESC_MAX);
    const ok = titleStatus === "PASS" && descStatus === "PASS";

    rows.push({
      key,
      url: cfg.canonical ?? "",
      title,
      titleLen: title.length,
      titleStatus,
      description,
      descLen: description.length,
      descStatus,
      ok,
    });

    if (titleStatus !== "PASS") errors.push(`${key} (${cfg.canonical}): title ${title.length} chars — ${titleStatus}\n    "${title}"`);
    if (descStatus !== "PASS") errors.push(`${key} (${cfg.canonical}): description ${description.length} chars — ${descStatus}\n    "${description}"`);
  }

  // Uniqueness
  for (const field of ["title", "description"] as const) {
    const seen = new Map<string, string[]>();
    for (const r of rows) seen.set(r[field], [...(seen.get(r[field]) ?? []), r.key]);
    for (const [value, keys] of seen) {
      if (keys.length > 1) errors.push(`duplicate ${field} on ${keys.join(", ")}: "${value}"`);
    }
  }

  return { rows, errors };
}

export function validateMeta() {
  const { rows, errors } = checkMeta();
  const pass = rows.filter((r) => r.ok).length;
  console.log(`validating meta: ${pass}/${rows.length} pages within range (title ${TITLE_MIN}-${TITLE_MAX}, desc ${DESC_MIN}-${DESC_MAX})`);

  if (errors.length) {
    console.error(`\n✗ ${errors.length} metadata problem(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("\nFix client/src/lib/seo.ts and rebuild.\n");
    throw new Error(`meta validation failed with ${errors.length} problem(s)`);
  }
}

const invokedDirectly = process.argv[1]?.endsWith("validate-meta.ts");
if (invokedDirectly) {
  try {
    validateMeta();
    console.log("all metadata within range and unique");
  } catch {
    process.exit(1);
  }
}
