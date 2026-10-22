import { Hono } from "hono";
import { q1 } from "../db.js";
import { HttpError, UUID_RE } from "../lib/http.js";
import { cartItemsForShipping, quoteShipping } from "../lib/shipping.js";

export const shipping = new Hono();

/**
 * Live estimate for checkout. With a delivery address it asks The Courier Guy; without one it
 * returns the weight-tier estimate. The order's real fee is recomputed server-side at checkout.
 */
shipping.get("/shipping/quote", async (c) => {
  const token = c.req.query("cart_token") ?? "";
  if (!UUID_RE.test(token)) throw new HttpError(400, "Invalid cart token");
  const cart = await q1<{ id: number }>("SELECT id FROM carts WHERE token = $1", [token.toLowerCase()]);
  if (!cart) throw new HttpError(404, "Cart not found");
  const items = await cartItemsForShipping(cart.id);
  const { fee, weightKg } = await quoteShipping(items, {
    street: c.req.query("street"), city: c.req.query("city"),
    province: c.req.query("province"), postalCode: c.req.query("postal_code"),
  });
  return c.json({ fee, weight_kg: weightKg });
});
