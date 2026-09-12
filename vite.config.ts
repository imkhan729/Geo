import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // These four are reached ONLY through `await import(...)` in
          // client/src/lib/geotag-utils.ts. They must be left unassigned so Rollup
          // emits them as async chunks that load on first use.
          //
          // Returning a name here (they used to share an "image-tools" chunk) makes
          // Rollup add a bare `import "./image-tools-*.js"` side-effect import to the
          // entry chunk to preserve execution order, dragging ~365 KB into the initial
          // load on every route. Letting the catch-all below fold them into "vendor"
          // is even worse, since vendor IS statically imported. So: bail out early,
          // explicitly, and let Rollup decide.
          if (
            id.includes("node_modules/piexifjs") ||
            id.includes("node_modules/heic2any") ||
            id.includes("node_modules/jszip") ||
            id.includes("node_modules/file-saver") ||
            id.includes("node_modules/pako") ||
            id.includes("node_modules/exifreader")
          ) return undefined;
          if (id.includes("node_modules/leaflet")) return "leaflet";
          if (id.includes("node_modules/react-dom")) return "react-dom";
          if (id.includes("node_modules/react/")) return "react";
          if (id.includes("node_modules/@radix-ui")) return "radix";
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/motion")) return "motion";
          if (id.includes("node_modules/")) return "vendor";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
