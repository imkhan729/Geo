#!/usr/bin/env node
/**
 * FreeGeoTagger IndexNow Deployment Hook & Submission CLI
 *
 * Implements Section 20 & Phase 11 requirements:
 * - Submits only changed canonical URLs
 * - Never submits user uploads, blob URLs, or query parameters
 * - Excludes sensitive data from logs
 * - Provides dry-run and live modes
 *
 * Usage:
 *   npx tsx script/indexnow-submit.ts --git               (Detects changed pages from git)
 *   npx tsx script/indexnow-submit.ts --all               (Submits all 17 canonical URLs)
 *   npx tsx script/indexnow-submit.ts --urls "https://freegeotagger.com/,https://freegeotagger.com/gps-finder"
 *   npx tsx script/indexnow-submit.ts --live              (Disables dry-run and submits to IndexNow API)
 */

import { execSync } from "child_process";
import {
  INDEXNOW_HOST,
  CANONICAL_ROUTES,
  getIndexNowKey,
  getKeyLocation,
  createIndexNowPayload,
  submitToIndexNow,
  mapChangedFilesToUrls,
  maskKey,
  sanitizeLog,
} from "../server/indexnow";

interface CliOptions {
  urls?: string[];
  git?: boolean;
  all?: boolean;
  live?: boolean;
  endpoint?: string;
  host?: string;
  key?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--git") {
      options.git = true;
    } else if (arg === "--all") {
      options.all = true;
    } else if (arg === "--live") {
      options.live = true;
    } else if (arg === "--urls" && i + 1 < args.length) {
      options.urls = args[++i].split(",").map((u) => u.trim());
    } else if (arg === "--endpoint" && i + 1 < args.length) {
      options.endpoint = args[++i];
    } else if (arg === "--host" && i + 1 < args.length) {
      options.host = args[++i];
    } else if (arg === "--key" && i + 1 < args.length) {
      options.key = args[++i];
    }
  }

  return options;
}

function getChangedFilesFromGit(): string[] {
  try {
    // Check files changed in the most recent commit or working tree
    const statusOut = execSync("git status --porcelain", { encoding: "utf8" });
    const workingFiles = statusOut
      .split("\n")
      .map((line) => line.trim().slice(3))
      .filter(Boolean);

    let commitFiles: string[] = [];
    try {
      const diffOut = execSync("git diff --name-only HEAD~1 HEAD", { encoding: "utf8" });
      commitFiles = diffOut.split("\n").map((line) => line.trim()).filter(Boolean);
    } catch {
      // Single commit repo or fresh checkout
    }

    return Array.from(new Set([...workingFiles, ...commitFiles]));
  } catch (err: any) {
    console.warn("[IndexNow Hook] Warning: Failed to query git diff:", err.message);
    return [];
  }
}

async function main() {
  const options = parseArgs();
  const host = options.host || INDEXNOW_HOST;
  const key = options.key || getIndexNowKey();
  const keyLocation = getKeyLocation(key, host);
  const isLive = options.live || process.env.INDEXNOW_SUBMIT === "true";

  console.log("=================================================");
  console.log("  FREEGEOTAGGER INDEXNOW SEARCH DISCOVERY HOOK   ");
  console.log("=================================================");
  console.log(`  Host:        ${host}`);
  console.log(`  Key:         ${maskKey(key)}`);
  console.log(`  KeyLocation: ${keyLocation}`);
  console.log(`  Execution:   ${isLive ? "LIVE SUBMISSION" : "DRY-RUN (Safe Verification)"}`);
  console.log("-------------------------------------------------");

  let targetUrls: string[] = [];

  if (options.urls && options.urls.length > 0) {
    targetUrls = options.urls;
    console.log(`[Mode: Explicit URLs] Received ${targetUrls.length} candidate URLs via CLI.`);
  } else if (options.all) {
    targetUrls = CANONICAL_ROUTES.map((r) => `https://${host}${r === "/" ? "/" : r}`);
    console.log(`[Mode: All Routes] Selected all ${targetUrls.length} canonical site routes.`);
  } else {
    // Default to Git change inspection
    const changedFiles = getChangedFilesFromGit();
    targetUrls = mapChangedFilesToUrls(changedFiles, host);
    console.log(
      `[Mode: Git Diff] Found ${changedFiles.length} changed files mapping to ${targetUrls.length} canonical URLs.`
    );

    // Fallback: If no files changed or git not available, include homepage & gps-finder
    if (targetUrls.length === 0) {
      console.log("[IndexNow Hook] No specific page changes detected. Falling back to core routes (/, /gps-finder).");
      targetUrls = [`https://${host}/`, `https://${host}/gps-finder`];
    }
  }

  // Create validated payload
  const result = createIndexNowPayload(targetUrls, { host, key, keyLocation });
  if (!result.valid || !result.payload) {
    console.error("\n[IndexNow Hook Error] Failed to generate valid IndexNow payload:");
    console.error("  Reason: ", result.error);
    if (result.invalidUrls) {
      console.error("  Invalid URLs: ", result.invalidUrls);
    }
    process.exit(1);
  }

  console.log("\n[IndexNow Validated URLs to Submit]:");
  result.payload.urlList.forEach((u, i) => console.log(`  [${i + 1}] ${u}`));
  console.log("-------------------------------------------------");

  // Submit
  const submission = await submitToIndexNow(result.payload, {
    dryRun: !isLive,
    endpoint: options.endpoint,
    logger: (msg) => console.log(sanitizeLog(msg, key)),
  });

  console.log("-------------------------------------------------");
  if (submission.success) {
    console.log(`✓ SUCCESS: ${submission.message || "Submitted successfully"} (status: ${submission.status})`);
    process.exit(0);
  } else {
    console.error(`✗ FAILURE: ${submission.error || "Submission rejected"} (status: ${submission.status})`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n[IndexNow Hook Fatal]:", err.message);
  process.exit(1);
});
