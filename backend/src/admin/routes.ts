import { Hono } from "hono";
import { put } from "@vercel/blob";
import { q, q1, getPool } from "../db.js";
import { config } from "../config.js";
import { deleteAccount } from "../lib/auth.js";
import { adminEnabled, endSession, requireAdmin, safeEqual, startSession } from "./session.js";
import * as v from "./views.js";

export const admin = new Hono();

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const html = (c: any, body: string, status = 200) => c.html(body, status, { "Cache-Control": "no-store" });

// ---------- login / logout (open) ----------
admin.get("/login", (c) => html(c, v.loginPage({
  error: c.req.query("error") !== undefined, loggedOut: c.req.query("logout") !== undefined, disabled: !adminEnabled(),
})));

admin.post("/login", async (c) => {
  if (!adminEnabled()) return c.redirect("/admin/login?error", 302);
  // Brute-force guard: 10 attempts / minute / IP, kept in Postgres.
  const ip = (c.req.header("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const window = Math.floor(Date.now() / 60_000);
  try {
    const row = await q1<{ count: number }>(
      `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, $2, 1)
       ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1 RETURNING count`,
      [`admin-login|${ip}`, window],
    );
    if (row && row.count > 10) return c.text("Too many attempts — wait a minute and try again.", 429);
  } catch { /* fail open */ }

  const body = await c.req.parseBody();
  const cfg = config().admin;
  const okUser = safeEqual(String(body.username ?? ""), cfg.username);
  const okPass = safeEqual(String(body.password ?? ""), cfg.password);
  if (!(okUser && okPass)) return c.redirect("/admin/login?error", 302);
  startSession(c, cfg.username);
  return c.redirect("/admin/", 302);
});

admin.post("/logout", (c) => { endSession(c); return c.redirect("/admin/login?logout", 302); });

// ---------- everything below needs a session ----------
admin.use("*", async (c, next) => {
  const p = new URL(c.req.url).pathname;
  if (p === "/admin/login" || p === "/admin/logout") return next();
  return requireAdmin(c, next);
});

admin.get("/", async (c) => {
  const orders = await q("SELECT id, reference, full_name, status, total, created_at FROM orders ORDER BY created_at DESC, id DESC");
  const revenue = orders.filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status)).reduce((a, o) => a + Math.round(o.total * 100), 0) / 100;
  const lowStock = await q("SELECT id, name, stock_qty FROM products WHERE active AND stock_qty < 5 ORDER BY name");
  const customerCount = (await q1<{ n: number }>("SELECT count(*) AS n FROM customers"))!.n;
  return html(c, v.dashboardPage({ orderCount: orders.length, revenue, customerCount: Number(customerCount), lowStock, recent: orders.slice(0, 8) }));
});

// ---------- orders ----------
admin.get("/orders", async (c) =>
  html(c, v.ordersPage(await q("SELECT * FROM orders ORDER BY created_at DESC, id DESC"))));

admin.get("/orders/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const o = Number.isInteger(id) ? await q1("SELECT * FROM orders WHERE id = $1", [id]) : null;
  if (!o) return c.text("Not found", 404);
  const items = await q("SELECT product_name, unit_price, quantity FROM order_items WHERE order_id = $1 ORDER BY id", [id]);
  return html(c, v.orderDetailPage(o, items, STATUSES));
});

admin.post("/orders/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const status = String((await c.req.parseBody()).status ?? "");
  if (!STATUSES.includes(status)) return c.text("Unknown status", 400);
  const row = await q1("UPDATE orders SET status = $1 WHERE id = $2 RETURNING id", [status, id]);
  if (!row) return c.text("Not found", 404);
  return c.redirect(`/admin/orders/${id}`, 302);
});

// ---------- customers ----------
admin.get("/customers", async (c) => {
  const rows = await q(`SELECT c.*, (SELECT count(*) FROM orders o WHERE o.customer_id = c.id)::int AS order_count
                          FROM customers c ORDER BY c.created_at DESC, c.id DESC`);
  return html(c, v.customersPage(rows, c.req.query("deleted") !== undefined));
});

admin.post("/customers/:id/delete", async (c) => {
  await deleteAccount(Number(c.req.param("id")));
  return c.redirect("/admin/customers?deleted", 302);
});

// ---------- categories ----------
admin.get("/categories", async (c) => html(c, v.categoriesPage(
  await q("SELECT * FROM categories ORDER BY sort_order, id"),
  { created: c.req.query("created") !== undefined, keyTaken: c.req.query("keyTaken") !== undefined },
)));

admin.post("/categories", async (c) => {
  const b = await c.req.parseBody();
  const key = String(b.key ?? "").trim(), label = String(b.label ?? "").trim();
  if (!key || !label) return c.text("Key and label are required", 400);
  if (await q1("SELECT 1 FROM categories WHERE key = $1", [key])) return c.redirect("/admin/categories?keyTaken", 302);
  await q("INSERT INTO categories (key, label, sort_order) VALUES ($1, $2, $3)", [key, label, parseInt(String(b.sortOrder ?? "0"), 10) || 0]);
  return c.redirect("/admin/categories?created", 302);
});

// ---------- products ----------
const categories = () => q("SELECT * FROM categories ORDER BY sort_order, id");
const canUpload = () => !!config().blobToken;

admin.get("/products", async (c) => html(c, v.productsPage(
  await q("SELECT p.*, c.label AS category_label FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.name"),
  { deleted: c.req.query("deleted") !== undefined, deactivatedInstead: c.req.query("deactivatedInstead") !== undefined },
)));

admin.get("/products/new", async (c) => html(c, v.productEditPage(null, await categories(),
  { created: false, saved: false, slugTaken: c.req.query("slugTaken") !== undefined, canUpload: canUpload() })));

admin.get("/products/:id/edit", async (c) => {
  const id = Number(c.req.param("id"));
  const p = Number.isInteger(id) ? await q1("SELECT * FROM products WHERE id = $1", [id]) : null;
  if (!p) return c.text("Not found", 404);
  return html(c, v.productEditPage(p, await categories(), {
    created: c.req.query("created") !== undefined, saved: c.req.query("saved") !== undefined, slugTaken: false, canUpload: canUpload(),
  }));
});

const money = (s: unknown): number | null => {
  const t = String(s ?? "").trim();
  return t === "" || !Number.isFinite(Number(t)) ? null : Number(t);
};
const text = (s: unknown): string | null => { const t = String(s ?? "").trim(); return t === "" ? null : t; };

admin.post("/products", async (c) => {
  const b = await c.req.parseBody();
  const slug = String(b.slug ?? "").trim();
  const price = money(b.price), weight = money(b.weightKg), stock = parseInt(String(b.stockQty ?? ""), 10);
  if (!slug || !String(b.name ?? "").trim() || !String(b.brand ?? "").trim() || !String(b.tagline ?? "").trim()
      || price === null || weight === null || !Number.isInteger(stock)) {
    return c.text("Missing or invalid product fields", 400);
  }
  if (await q1("SELECT 1 FROM products WHERE slug = $1", [slug])) return c.redirect("/admin/products/new?slugTaken", 302);
  const cat = await q1("SELECT id FROM categories WHERE id = $1", [Number(b.categoryId)]);
  if (!cat) return c.text("Unknown category", 400);
  const row = await q1(
    `INSERT INTO products (slug, name, brand, category_id, bundle, sku, tagline, description, cost_price, price, stock_qty, weight_kg, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [slug, String(b.name).trim(), String(b.brand).trim(), cat.id, b.bundle === "true", text(b.sku), String(b.tagline).trim(),
      text(b.description), money(b.costPrice), price, stock, weight, text(b.imageUrl)],
  );
  return c.redirect(`/admin/products/${row!.id}/edit?created`, 302);
});

admin.post("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const p = Number.isInteger(id) ? await q1("SELECT * FROM products WHERE id = $1", [id]) : null;
  if (!p) return c.text("Not found", 404);
  const b = await c.req.parseBody();
  const price = money(b.price), weight = money(b.weightKg), stock = parseInt(String(b.stockQty ?? ""), 10);
  const cat = await q1("SELECT id FROM categories WHERE id = $1", [Number(b.categoryId)]);
  if (!cat) return c.text("Unknown category", 400);
  if (price === null || weight === null || !Number.isInteger(stock)) return c.text("Missing or invalid product fields", 400);

  // A typed URL/path wins (works for photos in public/products). Otherwise an uploaded file goes to Blob.
  let imageUrl: string | null = p.image_url;
  const typed = text(b.imageUrl);
  const file = b.image;
  if (typed && typed !== p.image_url) imageUrl = typed;
  else if (file instanceof File && file.size > 0) {
    if (!canUpload()) return html(c, v.productEditPage(p, await categories(), { created: false, saved: false, slugTaken: false, canUpload: false, error: "Photo upload isn't configured (BLOB_READ_WRITE_TOKEN)." }), 400);
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      return html(c, v.productEditPage(p, await categories(), { created: false, saved: false, slugTaken: false, canUpload: true, error: "Upload an image under 8 MB." }), 400);
    }
    const ext = /\.[A-Za-z0-9]{1,5}$/.exec(file.name)?.[0] ?? "";
    const blob = await put(`products/${p.slug}-${crypto.randomUUID()}${ext}`, file, { access: "public", token: config().blobToken });
    imageUrl = blob.url;
  } else if (typed) imageUrl = typed;

  await q(
    `UPDATE products SET name=$1, brand=$2, category_id=$3, sku=$4, tagline=$5, description=$6, cost_price=$7, price=$8,
            stock_qty=$9, weight_kg=$10, active=$11, image_url=$12, version = version + 1 WHERE id=$13`,
    [String(b.name ?? "").trim(), String(b.brand ?? "").trim(), cat.id, text(b.sku), String(b.tagline ?? "").trim(), text(b.description),
      money(b.costPrice), price, stock, weight, b.active !== undefined && b.active !== "false", imageUrl, id],
  );
  return c.redirect(`/admin/products/${id}/edit?saved`, 302);
});

/** Hard-delete if never ordered/carted; otherwise deactivate so order history stays intact. */
admin.post("/products/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || !(await q1("SELECT 1 FROM products WHERE id = $1", [id]))) return c.text("Not found", 404);
  try {
    await getPool().query("DELETE FROM products WHERE id = $1", [id]);
    return c.redirect("/admin/products?deleted", 302);
  } catch (e: any) {
    if (e?.code !== "23503") throw e;
    await q("UPDATE products SET active = FALSE WHERE id = $1", [id]);
    return c.redirect("/admin/products?deactivatedInstead", 302);
  }
});
