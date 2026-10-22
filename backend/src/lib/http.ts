import type { Context } from "hono";

/** Same JSON error shape the Spring app used: { message }. */
export class HttpError extends Error {
  constructor(public status: 400 | 401 | 403 | 404 | 409 | 429 | 500, message: string) {
    super(message);
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function jsonBody(c: Context): Promise<Record<string, any>> {
  try {
    const b = await c.req.json();
    if (b && typeof b === "object" && !Array.isArray(b)) return b;
  } catch { /* fallthrough */ }
  throw new HttpError(400, "We couldn't read that request. Please try again.");
}

// ---- tiny validator producing Spring-style "field message" errors ----
type Rule = { field: string; label: string; required?: boolean; max?: number; min?: number; email?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(body: Record<string, any>, rules: Rule[]): void {
  for (const r of rules) {
    const v = body[r.field];
    const s = typeof v === "string" ? v : v == null ? "" : String(v);
    if (r.required && s.trim() === "") throw new HttpError(400, `${r.label} must not be blank`);
    if (s === "") continue;
    if (r.email && !EMAIL_RE.test(s)) throw new HttpError(400, `${r.label} must be a well-formed email address`);
    const min = r.min ?? 0;
    if (s.length < min || (r.max !== undefined && s.length > r.max)) {
      throw new HttpError(400, `${r.label} size must be between ${min} and ${r.max ?? 2147483647}`);
    }
  }
}

/** Money helpers — all arithmetic in integer cents to avoid float drift. */
export const toCents = (n: number | string): number => Math.round(Number(n) * 100);
export const fromCents = (c: number): number => c / 100;
