// Simple in-memory sliding-window rate limiter. Works because this app runs
// as a single persistent instance (same assumption the WebSocket broadcast
// layer relies on) — state resets on redeploy, which is fine for abuse
// throttling.

const buckets = new Map(); // key -> array of timestamps (ms)

// Periodically drop empty/stale keys so this doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < 60 * 60 * 1000);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 5 * 60 * 1000).unref?.();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Returns true if the request is allowed, false if it should be rejected.
// `name` scopes the bucket (e.g. "checkout", "signup") so different
// endpoints don't share a budget.
export function rateLimit(req, name, { windowMs, max }) {
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

// Convenience for API routes: checks the limit and, if exceeded, writes a
// 429 response and returns true (so the caller can `if (limited) return;`).
export function rateLimited(req, res, name, opts) {
  if (!rateLimit(req, name, opts)) {
    res.status(429).json({ error: "Too many requests — slow down and try again shortly." });
    return true;
  }
  return false;
}
