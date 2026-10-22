import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import type { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { config } from "../config.js";

const COOKIE = "gp_admin";
const TTL_S = 8 * 3600;

const sign = (payload: string) => createHmac("sha256", config().admin.sessionSecret).update(payload).digest("base64url");

export const adminEnabled = () => !!config().admin.password && config().admin.sessionSecret.length >= 16;

/** Constant-time string comparison (hash first so lengths always match). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function startSession(c: Context, username: string) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + TTL_S })).toString("base64url");
  setCookie(c, COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: new URL(c.req.url).protocol === "https:", sameSite: "Strict", path: "/admin", maxAge: TTL_S,
  });
}

export const endSession = (c: Context) => deleteCookie(c, COOKIE, { path: "/admin" });

function valid(c: Context): boolean {
  if (!adminEnabled()) return false;
  const raw = getCookie(c, COOKIE);
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return u === config().admin.username && exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

/** Gate for everything under /admin except login. Also blocks cross-site form posts (CSRF). */
export async function requireAdmin(c: Context, next: Next) {
  if (!valid(c)) return c.redirect("/admin/login", 302);
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    const origin = c.req.header("origin") ?? c.req.header("referer");
    if (origin) {
      let host = "";
      try { host = new URL(origin).host; } catch { /* leave blank */ }
      if (host !== new URL(c.req.url).host && host !== c.req.header("host")) return c.text("Cross-site request blocked", 403);
    }
  }
  return next();
}
