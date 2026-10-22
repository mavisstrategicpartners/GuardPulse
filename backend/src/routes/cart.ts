import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { q, q1 } from "../db.js";
import { HttpError, UUID_RE, jsonBody, validate } from "../lib/http.js";
import { cartDto } from "../lib/dto.js";

export const cart = new Hono();

async function findCart(token: string) {
  if (!UUID_RE.test(token)) throw new HttpError(400, "Invalid cart token");
  const row = await q1<{ id: number; token: string }>("SELECT id, token FROM carts WHERE token = $1", [token.toLowerCase()]);
  if (!row) throw new HttpError(404, "Cart not found");
  return row;
}

const stockMsg = (p: { stock_qty: number; name: string }) => `Only ${p.stock_qty} left in stock for "${p.name}"`;

cart.post("/cart", async (c) => {
  const row = await q1<{ id: number; token: string }>("INSERT INTO carts (token) VALUES ($1) RETURNING id, token", [randomUUID()]);
  return c.json(await cartDto(row!), 201);
});

cart.get("/cart/:token", async (c) => c.json(await cartDto(await findCart(c.req.param("token")))));

cart.post("/cart/:token/items", async (c) => {
  const ct = await findCart(c.req.param("token"));
  const b = await jsonBody(c);
  validate(b, [{ field: "product_slug", label: "productSlug", required: true }]);
  const quantity = b.quantity === undefined ? 1 : Number(b.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, "quantity must be greater than or equal to 1");
  const p = await q1("SELECT id, name, stock_qty FROM products WHERE slug = $1 AND active", [String(b.product_slug)]);
  if (!p) throw new HttpError(404, "Product not found");
  const existing = await q1<{ id: number; quantity: number }>("SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2", [ct.id, p.id]);
  const newQty = quantity + (existing?.quantity ?? 0);
  if (newQty > p.stock_qty) throw new HttpError(409, stockMsg(p));
  if (existing) await q("UPDATE cart_items SET quantity = $1 WHERE id = $2", [newQty, existing.id]);
  else await q("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity", [ct.id, p.id, quantity]);
  return c.json(await cartDto(ct));
});

async function findItem(cartId: number, idParam: string) {
  const id = Number(idParam);
  const item = Number.isInteger(id)
    ? await q1("SELECT ci.id, p.name, p.stock_qty FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = $1 AND ci.cart_id = $2", [id, cartId])
    : null;
  if (!item) throw new HttpError(404, "Cart item not found");
  return item;
}

cart.patch("/cart/:token/items/:itemId", async (c) => {
  const ct = await findCart(c.req.param("token"));
  const item = await findItem(ct.id, c.req.param("itemId"));
  const b = await jsonBody(c);
  const quantity = Number(b.quantity ?? 0);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    await q("DELETE FROM cart_items WHERE id = $1", [item.id]);
  } else {
    if (quantity > item.stock_qty) throw new HttpError(409, stockMsg(item));
    await q("UPDATE cart_items SET quantity = $1 WHERE id = $2", [Math.floor(quantity), item.id]);
  }
  return c.json(await cartDto(ct));
});

cart.delete("/cart/:token/items/:itemId", async (c) => {
  const ct = await findCart(c.req.param("token"));
  const item = await findItem(ct.id, c.req.param("itemId"));
  await q("DELETE FROM cart_items WHERE id = $1", [item.id]);
  return c.json(await cartDto(ct));
});
