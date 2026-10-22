import { createHash } from "node:crypto";
import { config } from "../config.js";

/**
 * PayFast signatures. IMPORTANT — the two are built differently (per PayFast's docs):
 *  - OUTGOING payment form: blank fields are left out, values are trimmed.
 *  - INCOMING ITN: EVERY posted field is included in the order received, blanks too.
 */

/** Matches PHP urlencode() (what PayFast signs against): space -> '+', everything but A-Za-z0-9-_. as %XX. */
export function urlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"))
    .replace(/%20/g, "+");
}

const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");

function withPassphrase(params: string): string {
  const p = config().payfast.passphrase.trim();
  return p ? `${params}&passphrase=${urlEncode(p)}` : params;
}

export function processUrl(): string {
  return config().payfast.sandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
}

function validateHost(): string {
  return config().payfast.sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
}

export function signOutgoing(fields: Record<string, string>): string {
  const parts: string[] = [];
  for (const [k, raw] of Object.entries(fields)) {
    if (k === "signature") continue;
    const v = (raw ?? "").trim();
    if (!v) continue;
    parts.push(`${k}=${urlEncode(v)}`);
  }
  return md5(withPassphrase(parts.join("&")));
}

export interface PayableOrder {
  reference: string;
  full_name: string;
  email: string;
  total: number; // rand
}

export function buildPaymentFields(order: PayableOrder): Record<string, string> {
  const pf = config().payfast;
  const fields: Record<string, string> = {};
  const put = (k: string, v: string | null | undefined) => {
    const t = (v ?? "").trim();
    if (t) fields[k] = t;
  };
  put("merchant_id", pf.merchantId);
  put("merchant_key", pf.merchantKey);
  put("return_url", `${pf.returnUrl}/${order.reference}`);
  put("cancel_url", `${pf.cancelUrl}/${order.reference}`);
  put("notify_url", pf.notifyUrl);
  const [first, ...rest] = order.full_name.trim().split(/\s+/);
  put("name_first", first.slice(0, 100));
  if (rest.length) put("name_last", rest.join(" ").slice(0, 100));
  put("email_address", order.email);
  put("m_payment_id", order.reference);
  put("amount", order.total.toFixed(2));
  put("item_name", `GuardPulse order ${order.reference}`);
  fields.signature = signOutgoing(fields);
  return fields;
}

/** Parses a form body keeping order and blank fields (PayFast's signature depends on both). */
export function parseFormBodyPreservingOrder(raw: string): Map<string, string> {
  const dec = (s: string) => {
    try { return decodeURIComponent(s.replace(/\+/g, " ")); } catch { return s; }
  };
  const out = new Map<string, string>();
  for (const pair of raw.split("&")) {
    if (!pair) continue;
    const i = pair.indexOf("=");
    out.set(dec(i >= 0 ? pair.slice(0, i) : pair), dec(i >= 0 ? pair.slice(i + 1) : ""));
  }
  return out;
}

export function itnParamString(fields: Map<string, string>): string {
  const parts: string[] = [];
  for (const [k, v] of fields) {
    if (k === "signature") continue;
    parts.push(`${k}=${urlEncode(v ?? "")}`);
  }
  return parts.join("&");
}

export function verifyItnSignature(fields: Map<string, string>): boolean {
  const given = fields.get("signature");
  if (!given) return false;
  return md5(withPassphrase(itnParamString(fields))).toLowerCase() === given.trim().toLowerCase();
}

/** PayFast's second check: post the params back and expect "VALID". Fails closed. */
export async function confirmWithPayFast(paramString: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${validateHost()}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramString,
      signal: AbortSignal.timeout(10_000),
    });
    const text = (await res.text()).trim();
    if (text.toUpperCase() !== "VALID") console.warn(`PayFast validate answered '${text}' (HTTP ${res.status})`);
    return text.toUpperCase() === "VALID";
  } catch (e) {
    console.error("PayFast server-side ITN validation call failed", e);
    return false;
  }
}

/** One-line startup/diagnostic summary, same warnings the Java app logged. */
export function logPayFastConfig(): void {
  const pf = config().payfast;
  console.log(`PayFast: mode=${pf.sandbox ? "SANDBOX (no real money)" : "LIVE"}, merchant_id=${pf.merchantId}, passphrase ${pf.passphrase ? "set" : "NOT set"}`);
  const local = (u: string) => !u || u.includes("localhost") || u.includes("127.0.0.1");
  if (!pf.sandbox) {
    if (local(pf.returnUrl) || local(pf.cancelUrl) || local(pf.notifyUrl)) console.error("PayFast is LIVE but a return/cancel/notify URL points at localhost.");
    if (pf.merchantId === "10000100") console.error("PayFast is LIVE but still using the sandbox test merchant id.");
  }
}
