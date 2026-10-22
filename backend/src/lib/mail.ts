import { waitUntil } from "@vercel/functions";
import { config } from "../config.js";

/** Sends through Resend's HTTPS API. Never throws — a mail problem must not fail an order. */
export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  const m = config().mail;
  if (!m.enabled) {
    console.log(`[mail disabled] to=${to} subject=${subject}\n${body}`);
    return;
  }
  if (!m.resendKey) {
    console.error(`RESEND_API_KEY is not set — email to ${to} ("${subject}") was not sent`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${m.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: m.from, to: [to], subject, text: body }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`Resend rejected email to ${to}: HTTP ${res.status} ${await res.text()}`);
  } catch (e) {
    console.error(`Failed to send email to ${to}`, e);
  }
}

/**
 * Serverless functions can be frozen once the response is sent, so background work must be
 * registered with waitUntil — this keeps the request fast but still lets the email finish.
 */
export function background(work: Promise<unknown>): Promise<unknown> {
  const safe = work.catch((e) => console.error("background task failed", e));
  try { waitUntil(safe); } catch { /* not on Vercel (local/tests) */ }
  return safe;
}
