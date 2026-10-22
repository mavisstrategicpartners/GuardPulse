import { Hono } from "hono";
import { q1 } from "../db.js";
import { HttpError, UUID_RE, toCents } from "../lib/http.js";
import { findOrderByReference, orderForMail } from "../lib/dto.js";
import * as pf from "../lib/payfast.js";
import { config } from "../config.js";
import { notifyPaymentConfirmed } from "../lib/notify.js";

export const payments = new Hono();

/** Frontend calls this to get the fields for the PayFast redirect. Safe to call again to retry payment. */
payments.get("/payments/payfast/:reference", async (c) => {
  const ref = c.req.param("reference");
  if (!UUID_RE.test(ref)) throw new HttpError(404, "Order not found");
  const o = await findOrderByReference(ref.toLowerCase());
  if (!o) throw new HttpError(404, "Order not found");
  if (o.status !== "PENDING") throw new HttpError(409, "This order isn't awaiting payment.");
  return c.json({ process_url: pf.processUrl(), fields: pf.buildPaymentFields(o) });
});

/**
 * PayFast calls this server-to-server. Only this webhook (never the browser redirect) marks an
 * order paid. Anything other than a plain 200 makes PayFast retry, so "nothing to do" answers
 * 200 and real failures answer 400.
 */
payments.post("/payments/payfast/itn", async (c) => {
  const fields = pf.parseFormBodyPreservingOrder(await c.req.text());
  if (!pf.verifyItnSignature(fields)) {
    console.warn("PayFast ITN signature mismatch, ignoring. Fields received:", [...fields.keys()]);
    return c.text("invalid signature", 400);
  }
  const merchantId = fields.get("merchant_id");
  if (merchantId && merchantId.trim() && merchantId !== config().payfast.merchantId) {
    console.warn(`PayFast ITN for a different merchant id (${merchantId}), ignoring`);
    return c.text("wrong merchant", 400);
  }
  if (!(await pf.confirmWithPayFast(pf.itnParamString(fields)))) {
    console.warn(`PayFast server-side ITN confirmation failed for ${fields.get("m_payment_id")}`);
    return c.text("could not confirm with payfast", 400);
  }

  const reference = fields.get("m_payment_id") ?? "";
  const order = UUID_RE.test(reference) ? await findOrderByReference(reference.toLowerCase()) : null;
  if (!order) {
    console.warn(`PayFast ITN for unknown order reference ${reference}`);
    return c.text("order not found, ignored", 200);
  }

  const gross = (fields.get("amount_gross") ?? fields.get("amount") ?? "").trim();
  const notified = Number(gross);
  if (!gross || !Number.isFinite(notified)) {
    console.warn(`PayFast ITN for order ${reference} had an unreadable amount: ${gross}`);
    return c.text("bad amount", 400);
  }
  if (toCents(notified) !== toCents(order.total)) {
    console.warn(`PayFast ITN amount mismatch for order ${reference}: expected ${order.total}, got ${notified}`);
    return c.text("amount mismatch", 400);
  }

  const status = fields.get("payment_status");
  if ((status ?? "").toUpperCase() === "COMPLETE") {
    // Atomic PENDING -> PAID: a retried ITN can never double-process or double-email.
    const paid = await q1("UPDATE orders SET status = 'PAID' WHERE id = $1 AND status = 'PENDING' RETURNING *", [order.id]);
    if (paid) {
      await notifyPaymentConfirmed(await orderForMail(paid));
      console.log(`Order ${reference} marked PAID via PayFast ITN (pf_payment_id ${fields.get("pf_payment_id")})`);
    } else {
      console.log(`PayFast ITN COMPLETE for order ${reference} already in status ${order.status}, nothing to do`);
    }
  } else {
    console.log(`PayFast ITN for order ${reference} has payment_status ${status}, order left as ${order.status}`);
  }
  return c.text("ok", 200);
});
