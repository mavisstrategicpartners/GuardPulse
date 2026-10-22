import { Hono } from "hono";
import { tx, q1 } from "../db.js";
import { HttpError, UUID_RE, fromCents, jsonBody, toCents, validate } from "../lib/http.js";
import { findOrderByReference, orderDto, orderForMail } from "../lib/dto.js";
import { cartItemsForShipping, quoteShipping } from "../lib/shipping.js";
import { resolve } from "../lib/auth.js";
import { notifyOrderPlaced } from "../lib/notify.js";

export const orders = new Hono();

orders.post("/orders", async (c) => {
  const b = await jsonBody(c);
  validate(b, [
    { field: "cart_token", label: "cartToken", required: true },
    { field: "full_name", label: "fullName", required: true },
    { field: "email", label: "email", required: true, email: true },
    { field: "phone", label: "phone", required: true },
    { field: "address_line1", label: "addressLine1", required: true },
    { field: "city", label: "city", required: true },
    { field: "province", label: "province", required: true },
    { field: "postal_code", label: "postalCode", required: true },
  ]);
  if (!UUID_RE.test(b.cart_token)) throw new HttpError(400, "Invalid cart token");
  const cart = await q1<{ id: number }>("SELECT id FROM carts WHERE token = $1", [b.cart_token.toLowerCase()]);
  if (!cart) throw new HttpError(400, "Cart not found or already checked out");
  const weighted = await cartItemsForShipping(cart.id);
  if (weighted.length === 0) throw new HttpError(400, "Cart is empty");

  // Shipping is ALWAYS computed here from the cart and the delivery address — never taken from the
  // request, otherwise anyone could check out with free delivery by sending 0.
  const { fee } = await quoteShipping(weighted, {
    street: b.address_line1, city: b.city, province: b.province, postalCode: b.postal_code,
  });
  const customer = await resolve(c.req.header("authorization"));

  const order = await tx(async (db) => {
    const lines = (await db.query(
      `SELECT ci.id AS ci_id, ci.quantity, p.id AS product_id, p.name, p.price
         FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = $1 ORDER BY p.id`,
      [cart.id],
    )).rows;
    if (lines.length === 0) throw new HttpError(400, "Cart is empty");

    // Lock the product rows (in id order, so two checkouts can't deadlock) before touching stock.
    const locked = (await db.query(
      "SELECT id, name, price, stock_qty FROM products WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE",
      [lines.map((l: any) => l.product_id)],
    )).rows;
    const byId = new Map<number, any>(locked.map((p: any) => [p.id, p]));

    let itemsCents = 0;
    for (const l of lines) {
      const p = byId.get(l.product_id);
      if (l.quantity > p.stock_qty) throw new HttpError(409, `Only ${p.stock_qty} left in stock for "${p.name}"`);
      itemsCents += toCents(p.price) * l.quantity;
    }
    const totalCents = itemsCents + toCents(fee);

    const o = (await db.query(
      `INSERT INTO orders (reference, status, full_name, email, phone, address_line1, address_line2, city, province,
                           postal_code, shipping_fee, total, customer_id)
       VALUES (gen_random_uuid(), 'PENDING', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [b.full_name, b.email, b.phone, b.address_line1, b.address_line2 ?? null, b.city, b.province, b.postal_code,
        fee, fromCents(totalCents), customer?.id ?? null],
    )).rows[0];

    for (const l of lines) {
      const p = byId.get(l.product_id);
      await db.query("UPDATE products SET stock_qty = stock_qty - $1, version = version + 1 WHERE id = $2", [l.quantity, p.id]);
      await db.query(
        "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES ($1, $2, $3, $4, $5)",
        [o.id, p.id, p.name, p.price, l.quantity],
      );
    }
    await db.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);
    return o;
  });

  await notifyOrderPlaced(await orderForMail(order));
  return c.json(await orderDto(order), 201);
});

// Registered before "/orders/:reference" so "lookup" isn't read as a reference.
orders.get("/orders/lookup", async (c) => {
  const reference = c.req.query("reference") ?? "";
  const email = c.req.query("email") ?? "";
  const notFound = new HttpError(404, "No order found for those details");
  if (!UUID_RE.test(reference)) throw notFound;
  const o = await findOrderByReference(reference.toLowerCase());
  if (!o || String(o.email).toLowerCase() !== email.trim().toLowerCase()) throw notFound;
  return c.json(await orderDto(o));
});

orders.get("/orders/:reference", async (c) => {
  const ref = c.req.param("reference");
  if (!UUID_RE.test(ref)) throw new HttpError(404, "Order not found");
  const o = await findOrderByReference(ref.toLowerCase());
  if (!o) throw new HttpError(404, "Order not found");
  return c.json(await orderDto(o));
});
