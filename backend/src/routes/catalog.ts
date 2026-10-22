import { Hono } from "hono";
import { q, q1 } from "../db.js";
import { HttpError, jsonBody, validate } from "../lib/http.js";
import { PRODUCT_SELECT, productDetail, productSummary } from "../lib/dto.js";

const page = <T>(results: T[]) => ({ count: results.length, next: null, previous: null, results });

export const catalog = new Hono();

catalog.get("/categories", async (c) => {
  const rows = await q("SELECT id, key, label, sort_order FROM categories ORDER BY sort_order, id");
  return c.json(page(rows.map((r) => ({ id: r.id, key: r.key, label: r.label, order: r.sort_order }))));
});

catalog.get("/products", async (c) => {
  const category = c.req.query("category");
  const bundle = c.req.query("bundle");
  let rows;
  if (category != null) {
    rows = await q(`${PRODUCT_SELECT} WHERE p.active AND c.key = $1 ORDER BY p.name ASC`, [category]);
  } else if (bundle?.toLowerCase() === "true") {
    rows = await q(`${PRODUCT_SELECT} WHERE p.active AND p.bundle ORDER BY p.name ASC`);
  } else {
    rows = await q(`${PRODUCT_SELECT} WHERE p.active ORDER BY p.name ASC`);
  }
  return c.json(page(rows.map(productSummary)));
});

catalog.get("/products/:slug", async (c) => {
  const p = await q1(`${PRODUCT_SELECT} WHERE p.slug = $1 AND p.active`, [c.req.param("slug")]);
  if (!p) return c.body(null, 404);
  return c.json(await productDetail(p));
});

const activeProduct = async (slug: string) => {
  const p = await q1("SELECT id FROM products WHERE slug = $1 AND active", [slug]);
  if (!p) throw new HttpError(404, "Product not found.");
  return p as { id: number };
};

catalog.get("/products/:slug/reviews", async (c) => {
  const p = await activeProduct(c.req.param("slug"));
  const rows = await q(
    "SELECT id, author_name, rating, comment, verified_purchase, created_at FROM products_reviews WHERE product_id = $1 ORDER BY created_at DESC, id DESC",
    [p.id],
  );
  const avg = rows.length ? rows.reduce((a: number, r: any) => a + r.rating, 0) / rows.length : 0;
  return c.json({
    average_rating: Math.round(avg * 10) / 10,
    count: rows.length,
    reviews: rows.map(reviewDto),
  });
});

catalog.post("/products/:slug/reviews", async (c) => {
  const p = await activeProduct(c.req.param("slug"));
  const b = await jsonBody(c);
  validate(b, [
    { field: "author_name", label: "authorName", required: true, max: 120 },
    { field: "comment", label: "comment", required: true, max: 2000 },
  ]);
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, rating > 5 ? "rating must be less than or equal to 5" : "rating must be greater than or equal to 1");
  }
  const row = await q1(
    `INSERT INTO products_reviews (product_id, author_name, rating, comment, verified_purchase)
     VALUES ($1, $2, $3, $4, FALSE) RETURNING id, author_name, rating, comment, verified_purchase, created_at`,
    [p.id, String(b.author_name).trim(), rating, String(b.comment).trim()],
  );
  return c.json(reviewDto(row));
});

function reviewDto(r: any) {
  return {
    id: r.id, author_name: r.author_name, rating: r.rating, comment: r.comment,
    verified_purchase: r.verified_purchase, created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}
