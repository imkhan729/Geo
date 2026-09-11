import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { serverGeocoding } from "./geocoding";
import {
  INDEXNOW_HOST,
  BING_SITE_AUTH_CODE,
  getIndexNowKey,
  createIndexNowPayload,
  submitToIndexNow,
} from "./indexnow";

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

  // Bing Webmaster Verification Route (Phase 11 requirement)
  app.get("/BingSiteAuth.xml", (_req: Request, res: Response) => {
    const code = process.env.BING_SITE_AUTH_CODE || BING_SITE_AUTH_CODE;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(`<?xml version="1.0"?>\n<users>\n  <user>${code}</user>\n</users>\n`);
  });

  // Dynamic IndexNow Key Text File (Phase 11 requirement)
  app.get("/:key([a-f0-9]{32,128}).txt", (req: Request, res: Response) => {
    const activeKey = getIndexNowKey();
    if (req.params.key === activeKey) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(`${activeKey}\n`);
    }
    return res.status(404).send("Not found");
  });

  // IndexNow Submission Endpoint (Phase 11 requirement)
  app.post("/api/indexnow", async (req: Request, res: Response) => {
    // Secret protection in production if ADMIN_SECRET is set
    if (process.env.ADMIN_SECRET) {
      const authHeader = req.headers.authorization;
      const keyHeader = req.headers["x-admin-key"];
      const authorized =
        keyHeader === process.env.ADMIN_SECRET ||
        authHeader === `Bearer ${process.env.ADMIN_SECRET}`;

      if (!authorized) {
        return res.status(401).json({ error: "Unauthorized: valid admin key required" });
      }
    }

    const { host, key, keyLocation, urlList } = req.body || {};

    const validation = createIndexNowPayload(urlList, {
      host: host || INDEXNOW_HOST,
      key,
      keyLocation,
    });

    if (!validation.valid || !validation.payload) {
      return res.status(400).json({
        error: validation.error || "Invalid IndexNow payload",
        invalidUrls: validation.invalidUrls,
      });
    }

    const dryRun = req.query.dryRun === "true" || process.env.INDEXNOW_SUBMIT !== "true";
    const result = await submitToIndexNow(validation.payload, { dryRun });

    return res.status(result.success ? 200 : result.status).json(result);
  });

  // Explicit 404 for unhandled API requests
  app.all("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return httpServer;
}
