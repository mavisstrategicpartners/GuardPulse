import { q, q1 } from "../db.js";
import { fromCents, toCents } from "./http.js";

export function productSummary(p: any) {
  return {
    id: p.id, slug: p.slug, name: p.name, brand: p.brand, category: p.category_key,
    is_bundle: p.bundle, tagline: p.tagline, price: p.price, stock_qty: p.stock_qty, image: p.image_url,
  };
}

export async function productDetail(p: any) {
  const specs = await q<{ text: string }>("SELECT text FROM product_specs WHERE product_id = $1 ORDER BY spec_order, id", [p.id]);
  return { ...productSummary(p), sku: p.sku, description: p.description, specs: specs.map((s) => ({ text: s.text })) };
}

export const PRODUCT_SELECT =
  "SELECT p.*, c.key AS category_key FROM products p JOIN categories c ON c.id = p.category_id";

export async function cartDto(cart: { id: number; token: string }) {
  const rows = await q(
    `SELECT ci.id AS item_id, ci.quantity, p.*, c.key AS category_key
       FROM cart_items ci JOIN products p ON p.id = ci.product_id JOIN categories c ON c.id = p.category_id
      WHERE ci.cart_id = $1 ORDER BY ci.id`,
    [cart.id],
  );
  let totalCents = 0;
  const items = rows.map((r) => {
    const sub = toCents(r.price) * r.quantity;
    totalCents += sub;
    return { id: r.item_id, product: productSummary(r), quantity: r.quantity, subtotal: fromCents(sub) };
  });
  return { token: cart.token, items, total: fromCents(totalCents) };
}

export async function loadOrderItems(orderId: number) {
  return q("SELECT product_name, unit_price, quantity FROM order_items WHERE order_id = $1 ORDER BY id", [orderId]);
}

export async function orderDto(o: any) {
  const items = await loadOrderItems(o.id);
  return {
    reference: o.reference,
    status: String(o.status).toLowerCase(),
    full_name: o.full_name, email: o.email, phone: o.phone,
    address_line1: o.address_line1, address_line2: o.address_line2,
    city: o.city, province: o.province, postal_code: o.postal_code,
    shipping_fee: o.shipping_fee, total: o.total,
    created_at: o.created_at instanceof Date ? o.created_at.toISOString() : o.created_at,
    items: items.map((i: any) => ({
      product_name: i.product_name, unit_price: i.unit_price, quantity: i.quantity,
      subtotal: fromCents(toCents(i.unit_price) * i.quantity),
    })),
  };
}

export async function orderForMail(o: any) {
  const items = await loadOrderItems(o.id);
  return {
    ...o,
    items: items.map((i: any) => ({
      product_name: i.product_name, quantity: i.quantity,
      subtotal: fromCents(toCents(i.unit_price) * i.quantity),
    })),
  };
}

export async function findOrderByReference(reference: string) {
  return q1("SELECT * FROM orders WHERE reference = $1", [reference]);
}

export function customerDto(c: any) {
  return {
    id: c.id, email: c.email, full_name: c.full_name, phone: c.phone,
    created_at: c.created_at instanceof Date ? c.created_at.toISOString() : c.created_at,
  };
}
