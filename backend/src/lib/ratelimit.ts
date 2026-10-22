import type { Context, Next } from "hono";
import { q1, q } from "../db.js";
import { config } from "../config.js";

const AUTH_LIMIT_PER_MINUTE = 20;

function clientIp(c: Context): string {
  const fwd = c.req.header("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : c.req.header("x-real-ip")) || "unknown";
}

/**
 * Fixed-window limiter kept in Postgres so it works across serverless instances.
 * Scoped to the abusable endpoints; auth gets a tighter budget. Fails OPEN if the
 * database hiccups — a limiter outage must never take the store down.
 */
export async function rateLimit(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;
  const limited = ["/api/cart", "/api/orders", "/api/payments", "/api/auth"].some((p) => path.startsWith(p));
  // PayFast's server-to-server notification must never be throttled.
  if (!limited || path.startsWith("/api/payments/payfast/itn")) return next();

  const auth = path.startsWith("/api/auth");
  const base = config().rateLimitPerMinute;
  const limit = auth ? Math.min(base, AUTH_LIMIT_PER_MINUTE) : base;
  const key = clientIp(c) + (auth ? "|auth" : "");
  const window = Math.floor(Date.now() / 60_000);
  try {
    const row = await q1<{ count: number }>(
      `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, $2, 1)
       ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1 RETURNING count`,
      [key, window],
    );
    if (Math.random() < 0.01) await q("DELETE FROM rate_limits WHERE window_start < $1", [window - 5]);
    if (row && row.count > limit) {
      return c.json({ error: "Too many requests — please slow down and try again shortly." }, 429);
    }
  } catch (e) {
    console.warn("rate limiter unavailable, allowing request", (e as Error).message);
  }
  return next();
}
