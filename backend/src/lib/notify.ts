import { sendMail, background } from "./mail.js";
import { config } from "../config.js";

export interface MailOrder {
  id: number;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  shipping_fee: number;
  total: number;
  items: { product_name: string; quantity: number; subtotal: number }[];
}

export const shortReference = (reference: string) => "GP-" + reference.slice(0, 8).toUpperCase();
const rand = (n: number) => `R${n.toFixed(2)}`;

function customerBody(o: MailOrder): string {
  let s = `Thanks, ${o.full_name}.\n\nYour order is confirmed. Reference: ${shortReference(o.reference)}\n\n`;
  for (const i of o.items) s += `  ${i.product_name.padEnd(45)} x${String(i.quantity).padEnd(3)}  ${rand(i.subtotal)}\n`;
  s += `\nShipping: ${rand(o.shipping_fee)}\nTotal: ${rand(o.total)}\n\nShipping to:\n${o.address_line1}`;
  if (o.address_line2 && o.address_line2.trim()) s += `, ${o.address_line2}`;
  s += `, ${o.city}, ${o.province} ${o.postal_code}\n\n`;
  s += "We'll email you again once your payment is confirmed and again when it ships.\n\n— GuardPulse";
  return s;
}

function merchantBody(o: MailOrder): string {
  const items = o.items.reduce((a, i) => a + i.subtotal, 0);
  return `New order from ${o.full_name} (${o.email}, ${o.phone})\nReference: ${shortReference(o.reference)}\n` +
    `Items subtotal: ${rand(items)}\nTotal (incl. shipping): ${rand(o.total)}\n\n` +
    `Manage this order in the admin panel: /admin/orders/${o.id}`;
}

export function notifyOrderPlaced(o: MailOrder) {
  const ref = shortReference(o.reference);
  return background(Promise.all([
    sendMail(o.email, `GuardPulse order confirmed — ${ref}`, customerBody(o)),
    sendMail(config().mail.adminAddress, `New GuardPulse order — ${ref}`, merchantBody(o)),
  ]));
}

export function notifyPaymentConfirmed(o: MailOrder) {
  const ref = shortReference(o.reference);
  return background(Promise.all([
    sendMail(o.email, `Payment received — GuardPulse order ${ref}`,
      `Thanks, ${o.full_name}. We've received your payment for order ${ref} (${rand(o.total)}).\n\nWe'll email you again once it ships.\n\n— GuardPulse`),
    sendMail(config().mail.adminAddress, `Payment received — order ${ref}`,
      `Order ${ref} from ${o.full_name} has been paid (${rand(o.total)}). Ready to fulfil.`),
  ]));
}

export function notifyPasswordReset(email: string, fullName: string, rawToken: string) {
  const first = fullName.trim().split(/\s+/)[0] || "there";
  const link = `${config().frontendUrl.replace(/\/+$/, "")}/reset-password?token=${rawToken}`;
  const body = `Hi ${first},\n\nWe received a request to reset your GuardPulse account password.\n` +
    `Reset it here (this link works once and expires in 1 hour):\n${link}\n\n` +
    `If you didn't ask for this, you can safely ignore this email — your\npassword hasn't been changed.\n\n— GuardPulse`;
  return background(sendMail(email, "Reset your GuardPulse password", body));
}
