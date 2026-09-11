import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  const seoRoutes: Record<string, string> = {
    "/gps-finder": "gps-finder.html",
    "/blog": "blog.html",
    "/blog/best-free-photo-geotagging-tools": "blog-best-free-photo-geotagging-tools.html",
    "/blog/how-to-add-gps-to-iphone-photos": "blog-how-to-add-gps-to-iphone-photos.html",
    "/blog/how-to-geotag-photos-android": "blog-how-to-geotag-photos-android.html",
    "/blog/how-to-geotag-photos-for-google-business-profile": "blog-how-to-geotag-photos-for-google-business-profile.html",
    "/blog/how-to-geotag-photos-for-real-estate": "blog-how-to-geotag-photos-for-real-estate.html",
    "/blog/what-is-exif-gps-metadata": "blog-what-is-exif-gps-metadata.html",
    "/privacy": "privacy.html",
    "/terms": "terms.html",
    "/cookies": "cookies.html",
  };

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    const routePath = req.path.replace(/\/$/, "") || "/";
    const fileName = seoRoutes[routePath];
    if (!fileName) return next();

    const seoFilePath = path.resolve(distPath, "seo-routes", fileName);
    if (!fs.existsSync(seoFilePath)) return next();

    res.sendFile(seoFilePath);
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
