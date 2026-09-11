import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { serverGeocoding } from "./geocoding";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint (Phase 7 requirement)
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: "FreeGeoTagger API",
      version: "2.0.0",
    });
  });

  // Geocoding Search Proxy (Phase 7 requirement)
  app.get("/api/geocode/search", async (req: Request, res: Response) => {
    const q = req.query.q;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Missing or invalid query parameter 'q'" });
    }

    const trimmed = q.trim();
    if (trimmed.length < 3) {
      return res.json([]);
    }

    try {
      const results = await serverGeocoding.search(trimmed);
      return res.json(results);
    } catch (err: any) {
      return res.status(500).json({ error: "Geocoding search failed", details: err.message });
    }
  });

  // Reverse Geocoding Proxy (Phase 7 requirement)
  app.get("/api/geocode/reverse", async (req: Request, res: Response) => {
    const latStr = req.query.lat;
    const lngStr = req.query.lng;

    if (!latStr || !lngStr || typeof latStr !== "string" || typeof lngStr !== "string") {
      return res.status(400).json({ error: "Missing 'lat' or 'lng' query parameter" });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Coordinates out of valid range" });
    }

    try {
      const result = await serverGeocoding.reverse(lat, lng);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: "Reverse geocoding failed", details: err.message });
    }
  });

  // IndexNow Submission Endpoint (Phase 7 & 11 readiness)
  app.post("/api/indexnow", async (req: Request, res: Response) => {
    const { host, key, keyLocation, urlList } = req.body || {};

    if (!Array.isArray(urlList) || urlList.length === 0) {
      return res.status(400).json({ error: "Invalid 'urlList': must be a non-empty array of URLs" });
    }

    const effectiveHost = host || "freegeotagger.com";
    const apiKey = key || process.env.INDEXNOW_KEY || "development_key";

    // Validate URLs belong to target host
    const invalidUrls = urlList.filter(
      (u: any) => typeof u !== "string" || !u.includes(effectiveHost)
    );

    if (invalidUrls.length > 0) {
      return res.status(400).json({
        error: "All URLs in urlList must belong to the specified host",
        invalidUrls: invalidUrls.slice(0, 5),
      });
    }

    // In production with valid key, forward to IndexNow API
    if (process.env.INDEXNOW_SUBMIT === "true" && process.env.INDEXNOW_KEY) {
      try {
        const payload = {
          host: effectiveHost,
          key: apiKey,
          keyLocation: keyLocation || `https://${effectiveHost}/${apiKey}.txt`,
          urlList,
        };

        const response = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });

        return res.json({
          success: response.ok,
          status: response.status,
          submittedCount: urlList.length,
        });
      } catch (err: any) {
        return res.status(502).json({ error: "IndexNow submission failed", details: err.message });
      }
    }

    // Development/dry-run mode
    return res.json({
      success: true,
      mode: "dry-run",
      host: effectiveHost,
      submittedCount: urlList.length,
      message: "IndexNow payload validated successfully (dry-run mode)",
    });
  });

  return httpServer;
}
