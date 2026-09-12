/**
 * Automated Test Suite: Phase 16 — Ads Readiness Only
 *
 * Verifies:
 * 1. Default disabled state (monetization inactive by default).
 * 2. Publisher credentials match ads.txt and index.html meta tag.
 * 3. CLS protection: all placement slots define fixed min-height reservations.
 * 4. Core Tool Safety Invariant: zero ads inside Dropzone, CoordinatePanel, FileQueue, or LeafletMap.
 * 5. Safe placement coverage in Home, GPS Finder, and Blog templates.
 * 6. Google Consent Mode v2 advertising consent hook logic.
 */

import { ADS_CONFIG } from "../client/src/lib/ads-config";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log("  ✓ " + testName);
    passed++;
  } else {
    console.error("  ✗ FAIL: " + testName);
    failed++;
  }
}

console.log("\n🧪 Running Phase 16 Ads Readiness Verification Suite...\n");

// ── Test Group 1: Master Configuration & Disabled Invariant ──
console.log("Group 1: Master Configuration & Disabled Invariant");
assert(ADS_CONFIG.enabled === false, "ADS_CONFIG.enabled is strictly FALSE by default (monetization inactive)");
assert(ADS_CONFIG.client === "ca-pub-6438644207209483", "ADS_CONFIG.client matches verified publisher ID");

// ── Test Group 2: AdSense Credential & ads.txt Validation ──
console.log("\nGroup 2: AdSense Credential & ads.txt Validation");
const adsTxtPath = path.resolve(process.cwd(), "client/public/ads.txt");
assert(fs.existsSync(adsTxtPath), "client/public/ads.txt exists");
const adsTxtContent = fs.readFileSync(adsTxtPath, "utf-8");
assert(adsTxtContent.includes("pub-6438644207209483"), "ads.txt contains publisher ID pub-6438644207209483");
assert(adsTxtContent.includes("DIRECT"), "ads.txt specifies DIRECT publisher relationship");

const indexHtmlPath = path.resolve(process.cwd(), "client/index.html");
const indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
assert(
  indexHtmlContent.includes('<meta name="google-adsense-account" content="ca-pub-6438644207209483"'),
  "client/index.html declares google-adsense-account meta tag matching publisher ID"
);

// ── Test Group 3: CLS Protection & Slot Geometry Reservation ──
console.log("\nGroup 3: CLS Protection & Slot Geometry Reservation");
const placements = Object.values(ADS_CONFIG.placements);
assert(placements.length >= 5, "At least 5 standard placements configured (" + placements.length + " found)");

for (const p of placements) {
  assert(p.minHeightMobile >= 50, p.id + ": mobile min-height is reserved (>= 50px)");
  assert(p.minHeightDesktop >= 90, p.id + ": desktop min-height is reserved (>= 90px)");
  assert(typeof p.format === "string", p.id + ": specifies explicit format (" + p.format + ")");
}

// ── Test Group 4: Core Tool Safe Zones Invariant (Zero Ads in Tool) ──
console.log("\nGroup 4: Core Tool Safe Zones (Zero Ads in Interaction Components)");
const toolDir = path.resolve(process.cwd(), "client/src/components/tool");
const toolFiles = fs.readdirSync(toolDir).filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));
let toolAdViolations = 0;

for (const tf of toolFiles) {
  const content = fs.readFileSync(path.join(toolDir, tf), "utf-8");
  if (content.includes("<AdSlot") || content.includes("adsbygoogle")) {
    console.error("  Violation in " + tf + ": core tool component contains an ad unit!");
    toolAdViolations++;
  }
}
assert(toolAdViolations === 0, "Zero ad units inside core tool components (" + toolFiles.length + " files inspected)");

// ── Test Group 5: Recommended Placement Presence ──
console.log("\nGroup 5: Recommended Placement Architecture Presence");
const homeContent = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/home.tsx"), "utf-8");
assert(homeContent.includes('placement="homepage-below-tool"'), "Homepage includes homepage-below-tool AdSlot");
assert(homeContent.includes('placement="homepage-mid-content"'), "Homepage includes homepage-mid-content AdSlot");
assert(homeContent.includes('placement="homepage-bottom"'), "Homepage includes homepage-bottom AdSlot");

const gpsFinderContent = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/gps-finder.tsx"), "utf-8");
assert(gpsFinderContent.includes('placement="gps-finder-below-tool"'), "GPS Finder includes gps-finder-below-tool AdSlot");

const blogExtrasContent = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/blog-extras.tsx"), "utf-8");
assert(blogExtrasContent.includes("export function BlogAdSlot"), "blog-extras exports reusable BlogAdSlot");

// ── Test Group 6: Component Implementation & Security Guardrails ──
console.log("\nGroup 6: Component Implementation & Security Guardrails");
const adSlotContent = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ad-slot.tsx"), "utf-8");
assert(adSlotContent.includes("FORBIDDEN_PLACEMENTS"), "AdSlot defines FORBIDDEN_PLACEMENTS blocklist");
assert(adSlotContent.includes("hasAdConsent"), "AdSlot checks user advertising consent before render");
assert(adSlotContent.includes("reserveSpace"), "AdSlot implements pre-allocated reserveSpace logic");

console.log("\n========================================");
console.log("Phase 16 Ads Readiness Results: " + passed + " passed, " + failed + " failed");
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
}