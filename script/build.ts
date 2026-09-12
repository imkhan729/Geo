import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { generateSeoPages } from "./generate-seo-pages";
import { validateMeta } from "./validate-meta";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "express",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // Fail fast, before spending time on the client build, if any page's title or
  // description is outside Google's SERP rendering limits or is duplicated.
  validateMeta();

  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  await generateSeoPages();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
