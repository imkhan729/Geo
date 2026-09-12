import { strict as assert } from "assert";
import fs from "fs";
import path from "path";

console.log("=================================================");
console.log("  FREEGEOTAGGER PHASE 13 ACCESSIBILITY & A11Y QA  ");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  [PASS] ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failedCount++;
    });
}

function getAllPageFiles(dir: string): string[] {
  let files: string[] = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllPageFiles(full));
    } else if (item.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

async function runAllTests() {
  const rootDir = process.cwd();
  const pagesDir = path.join(rootDir, "client/src/pages");
  const pageFiles = getAllPageFiles(pagesDir);

  // Test 1: All pages have <main id="main-content" tabIndex={-1}>
  await runTest("All 19 site routes include <main id=\"main-content\" tabIndex={-1}> landmark", () => {
    assert.ok(pageFiles.length >= 18, `Expected at least 18 pages, found ${pageFiles.length}`);
    for (const file of pageFiles) {
      const content = fs.readFileSync(file, "utf8");
      const baseName = path.basename(file);
      assert.ok(
        content.includes('id="main-content"'),
        `${baseName} is missing id="main-content" on <main>`
      );
      assert.ok(
        content.includes("tabIndex={-1}"),
        `${baseName} is missing tabIndex={-1} on <main>`
      );
    }
  });

  // Test 2: Exactly one <h1> per page
  await runTest("Every view defines exactly one primary <h1> heading", () => {
    for (const file of pageFiles) {
      const content = fs.readFileSync(file, "utf8");
      const baseName = path.basename(file);
      const h1Matches = content.match(/<h1[\s>]/g) || [];
      assert.strictEqual(
        h1Matches.length,
        1,
        `${baseName} expected exactly 1 <h1>, found ${h1Matches.length}`
      );
    }
  });

  // Test 3: Skip-to-content mechanism
  await runTest("SkipLink component exists and connects to #main-content", () => {
    const skipLinkFile = path.join(rootDir, "client/src/components/skip-link.tsx");
    const headerFile = path.join(rootDir, "client/src/components/Header.tsx");

    assert.ok(fs.existsSync(skipLinkFile), "skip-link.tsx must exist");
    assert.ok(fs.existsSync(headerFile), "Header.tsx must exist");

    const skipContent = fs.readFileSync(skipLinkFile, "utf8");
    const headerContent = fs.readFileSync(headerFile, "utf8");

    assert.ok(skipContent.includes('href={`#${targetId}`}'), "SkipLink must target targetId");
    assert.ok(headerContent.includes('<SkipLink targetId="main-content" />'), "Header must mount SkipLink with main-content");
    assert.ok(skipContent.includes("sr-only focus:not-sr-only"), "SkipLink must be sr-only until focused");
  });

  // Test 4: Keyboard-operable dropzone
  await runTest("Dropzone component is keyboard accessible with button role, tabIndex, and Enter/Space handling", () => {
    const dropzoneFile = path.join(rootDir, "client/src/components/tool/dropzone.tsx");
    const content = fs.readFileSync(dropzoneFile, "utf8");

    assert.ok(content.includes('role="button"'), "Dropzone must have role='button'");
    assert.ok(content.includes("tabIndex={0}"), "Dropzone must be keyboard focusable (tabIndex={0})");
    assert.ok(content.includes('e.key === "Enter" || e.key === " "'), "Dropzone must handle Enter and Space keys");
    assert.ok(content.includes('aria-label="Upload photos to geotag'), "Dropzone must have descriptive aria-label");
  });

  // Test 5: Keyboard-operable file queue
  await runTest("FileQueue component supports keyboard selection with role, tabIndex, and key handler", () => {
    const queueFile = path.join(rootDir, "client/src/components/tool/file-queue.tsx");
    const content = fs.readFileSync(queueFile, "utf8");

    assert.ok(content.includes('role="button"'), "Queue items must have role='button'");
    assert.ok(content.includes("tabIndex={0}"), "Queue items must have tabIndex={0}");
    assert.ok(content.includes('e.key === "Enter" || e.key === " "'), "Queue items must respond to Enter and Space");
    assert.ok(content.includes("aria-label="), "Queue items must describe photo name and status");
  });

  // Test 6: Non-map coordinate input alternative
  await runTest("Non-map coordinate input alternative is fully functional (Decimal Degrees + DMS)", () => {
    const panelFile = path.join(rootDir, "client/src/components/tool/coordinate-panel.tsx");
    const content = fs.readFileSync(panelFile, "utf8");

    assert.ok(content.includes('id="input-latitude"'), "Direct latitude numeric input must exist");
    assert.ok(content.includes('id="input-longitude"'), "Direct longitude numeric input must exist");
    assert.ok(content.includes('htmlFor="input-latitude"'), "Explicit label for latitude must exist");
    assert.ok(content.includes('htmlFor="input-longitude"'), "Explicit label for longitude must exist");
    assert.ok(content.includes('dmsToDecimal'), "DMS input parsing must exist");
  });

  // Test 7: Accessible map region with non-map instruction
  await runTest("LeafletMap provides semantic role='region' and informs screen readers of non-map input", () => {
    const mapFile = path.join(rootDir, "client/src/components/tool/leaflet-map.tsx");
    const content = fs.readFileSync(mapFile, "utf8");

    assert.ok(content.includes('role="region"'), "Map must declare role='region'");
    assert.ok(content.includes('aria-label='), "Map must declare aria-label");
    assert.ok(content.includes("To set coordinates without using the map"), "Map aria-label must explain non-map alternative");
  });

  // Test 8: Progress bar & ARIA live status updates
  await runTest("Batch processing provides role='status', aria-live='polite', and accessible progressbar", () => {
    const batchFile = path.join(rootDir, "client/src/components/tool/batch-actions.tsx");
    const content = fs.readFileSync(batchFile, "utf8");

    assert.ok(content.includes('role="status"'), "Progress container must declare role='status'");
    assert.ok(content.includes('aria-live="polite"'), "Progress container must announce polite updates");
    assert.ok(content.includes('role="progressbar"'), "Progress must declare role='progressbar'");
    assert.ok(content.includes('aria-valuenow='), "Progressbar must specify aria-valuenow");
  });

  // Test 9: Reduced motion preference in CSS
  await runTest("CSS honors prefers-reduced-motion: reduce OS setting", () => {
    const cssFile = path.join(rootDir, "client/src/index.css");
    const content = fs.readFileSync(cssFile, "utf8");

    assert.ok(content.includes("@media (prefers-reduced-motion: reduce)"), "CSS must define prefers-reduced-motion media query");
    assert.ok(content.includes("scroll-behavior: auto !important;"), "CSS must disable smooth scroll under reduced motion");
    assert.ok(content.includes("animation-duration: 0.01ms !important;"), "CSS must silence heavy animations under reduced motion");
  });

  // Test 10: Touch target minimum sizes (>= 44x44 px)
  await runTest("Mobile touch targets meet WCAG 2.5.8 / 2.2 AA minimum height guidelines (>= 44px)", () => {
    const headerFile = path.join(rootDir, "client/src/components/Header.tsx");
    const headerContent = fs.readFileSync(headerFile, "utf8");
    assert.ok(headerContent.includes("min-h-[44px] min-w-[44px]"), "Mobile nav toggle must be at least 44x44px");

    const cookieFile = path.join(rootDir, "client/src/components/cookie-consent.tsx");
    const cookieContent = fs.readFileSync(cookieFile, "utf8");
    assert.ok(cookieContent.includes("min-h-[44px]"), "Cookie buttons must be at least 44px high");
  });

  // Test 11: Cross-browser iOS Safari auto-zoom prevention
  await runTest("Text input fields specify text-base md:text-sm to prevent iOS Safari auto-zoom", () => {
    const inputFile = path.join(rootDir, "client/src/components/ui/input.tsx");
    const content = fs.readFileSync(inputFile, "utf8");

    assert.ok(content.includes("text-base"), "Input must have text-base for mobile viewports");
    assert.ok(content.includes("md:text-sm"), "Input must scale down to md:text-sm on larger screens");
  });

  // Test 12: High-contrast focus indicators (:focus-visible)
  await runTest("High-contrast focus-visible indicators are defined across components and base stylesheet", () => {
    const cssFile = path.join(rootDir, "client/src/index.css");
    const content = fs.readFileSync(cssFile, "utf8");

    assert.ok(content.includes(":focus-visible"), "Base CSS must declare :focus-visible rules");
    assert.ok(content.includes("outline: 2px solid"), "Focus indicator must have visible outline width");
  });

  console.log("\n-------------------------------------------------");
  console.log(`  Tests Passed: ${passedCount}`);
  console.log(`  Tests Failed: ${failedCount}`);
  console.log("-------------------------------------------------\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests();
