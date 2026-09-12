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

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Lightweight sliding-window in-memory IP rate limiter.
 * Protects geocoding proxies and API endpoints from abuse with zero external dependencies.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const hits = new Map<string, RateLimitRecord>();
  const { windowMs, max, message = "Too many requests, please try again later." } = options;

  // Cleanup expired entries periodically to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    hits.forEach((record, ip) => {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    });
  }, Math.max(windowMs, 60000));
  cleanupInterval.unref?.();

  return (req: Request, res: Response, next: () => void) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : undefined) ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds.toString());
      return res.status(429).json({ error: message, retryAfter: resetSeconds });
    }

    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Rate Limiters (Phase 14 Security Hardening)
  const apiGeneralLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: "General API rate limit exceeded. Please wait a minute.",
  });
  const geocodeLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: "Geocoding rate limit exceeded (max 60/min). Please try again shortly.",
  });
  const indexNowLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: "IndexNow submission rate limit exceeded (max 10/min). Please try again shortly.",
  });

  // Apply general limiter to all API endpoints
  app.use("/api", apiGeneralLimiter);

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

  // Geocoding Search Proxy (Phase 7 + Phase 14 validation & rate limiting)
  app.get("/api/geocode/search", geocodeLimiter, async (req: Request, res: Response) => {
    const rawQuery = req.query.q;
    if (!rawQuery || typeof rawQuery !== "string") {
      return res.status(400).json({ error: "Missing or invalid query parameter 'q'" });
    }

    // Strip control characters to prevent injection / parser abuse
    const sanitized = rawQuery.replace(/[\x00-\x1F\x7F]/g, "").trim();

    if (sanitized.length > 128) {
      return res.status(400).json({ error: "Search query exceeds maximum length of 128 characters" });
    }

    if (sanitized.length < 3) {
      return res.json([]);
    }

    try {
      const results = await serverGeocoding.search(sanitized);
      return res.json(results);
    } catch (err: any) {
      return res.status(500).json({ error: "Geocoding search failed", details: err.message });
    }
  });

  // Reverse Geocoding Proxy (Phase 7 + Phase 14 validation & rate limiting)
  app.get("/api/geocode/reverse", geocodeLimiter, async (req: Request, res: Response) => {
    const latStr = req.query.lat;
    const lngStr = req.query.lng;

    if (!latStr || !lngStr || typeof latStr !== "string" || typeof lngStr !== "string") {
      return res.status(400).json({ error: "Missing 'lat' or 'lng' query parameter" });
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Coordinates must be valid finite numbers" });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: "Coordinates out of valid range: latitude must be [-90, 90], longitude must be [-180, 180]",
      });
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
  app.get("/:key.txt", (req: Request, res: Response, next) => {
    const key = req.params.key;
    if (typeof key !== "string" || !/^[a-f0-9]{32,128}$/.test(key)) {
      return next();
    }
    const activeKey = getIndexNowKey();
    if (key === activeKey) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(`${activeKey}\n`);
    }
    return res.status(404).send("Not found");
  });

  // IndexNow Submission Endpoint (Phase 11 requirement + Phase 14 rate limiting)
  app.post("/api/indexnow", indexNowLimiter, async (req: Request, res: Response) => {
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

    if (Array.isArray(urlList) && urlList.length > 10000) {
      return res.status(400).json({
        error: "URL list exceeds maximum batch limit of 10,000 URLs",
      });
    }

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
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return httpServer;
}
