// Seeds / refreshes the catalogue — the same behaviour as the old DataSeeder + CatalogExpansionSeeder.
//  1. Empty database: create categories and the core products (stock 25).
//  2. Existing database: bring tagline / description / spec lines up to date. Price, stock,
//     photos and the active flag are NEVER touched (the admin panel owns those).
//  3. Add any products from the expansion list that are missing (existing rows are never changed).
// Run with: npm run seed
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "../src/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const load = (f: string): any[] => JSON.parse(fs.readFileSync(path.join(here, "..", "src", "seed", f), "utf8"));

export async function seed() {
  const core = load("core.json"), expansion = load("expansion.json");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const one = async (sql: string, p: unknown[] = []) => (await client.query(sql, p)).rows[0];
    const setSpecs = async (productId: number, specs: string[]) => {
      await client.query("DELETE FROM product_specs WHERE product_id = $1", [productId]);
      for (let i = 0; i < specs.length; i++) {
        await client.query("INSERT INTO product_specs (product_id, text, spec_order) VALUES ($1, $2, $3)", [productId, specs[i], i]);
      }
    };

    const empty = Number((await one("SELECT count(*) AS n FROM products")).n) === 0;
    let log = "";
    if (empty) {
      const cats: Record<string, number> = {};
      for (const [i, [key, label]] of [["indoor", "Indoor"], ["outdoor", "Outdoor"], ["solar", "Solar-powered"]].entries()) {
        cats[key] = (await one(
          "INSERT INTO categories (key, label, sort_order) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET label = categories.label RETURNING id",
          [key, label, i + 1])).id;
      }
      for (const s of core) {
        const p = await one(
          `INSERT INTO products (slug, name, brand, category_id, bundle, sku, tagline, description, cost_price, price, stock_qty, weight_kg, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,25,$11,$12) RETURNING id`,
          [s.slug, s.name, s.brand, cats[s.category], s.bundle, s.sku, s.tagline, s.description, s.cost_price, s.price, s.weight_kg, `/products/${s.slug}.jpg`]);
        await setSpecs(p.id, s.specs);
      }
      log += `Seeded ${Object.keys(cats).length} categories and ${core.length} products. `;
    } else {
      let updated = 0;
      for (const s of core) {
        const p = await one("SELECT id, tagline, description FROM products WHERE slug = $1", [s.slug]);
        if (!p) continue;
        const cur = (await client.query("SELECT text FROM product_specs WHERE product_id = $1 ORDER BY spec_order, id", [p.id])).rows.map((r) => r.text);
        const same = p.tagline === s.tagline && p.description === s.description && JSON.stringify(cur) === JSON.stringify(s.specs);
        if (!same) {
          await client.query("UPDATE products SET tagline = $1, description = $2 WHERE id = $3", [s.tagline, s.description, p.id]);
          await setSpecs(p.id, s.specs);
          updated++;
        }
      }
      if (updated) log += `Updated wording for ${updated} products. `;
    }

    const cats = new Map<string, number>((await client.query("SELECT id, key FROM categories")).rows.map((r) => [r.key, r.id]));
    let created = 0;
    for (const s of expansion) {
      if (await one("SELECT 1 FROM products WHERE slug = $1", [s.slug])) continue; // never overwrite
      if (!cats.has(s.category)) {
        const c = await one("INSERT INTO categories (key, label, sort_order) VALUES ($1,$2,$3) RETURNING id", [s.category, s.category_label, cats.size + 10]);
        cats.set(s.category, c.id);
      }
      const cost = Math.round(Number(s.price) * 0.65 * 100) / 100; // placeholder 65% margin, as before — correct in admin
      const p = await one(
        `INSERT INTO products (slug, name, brand, category_id, bundle, sku, tagline, description, cost_price, price, stock_qty, weight_kg, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [s.slug, s.name, s.brand, cats.get(s.category), s.bundle, s.sku, s.tagline, s.description, cost, s.price, s.stock_qty, s.weight_kg, `/products/${s.slug}.jpg`]);
      await setSpecs(p.id, s.specs);
      created++;
    }
    if (created) log += `Added ${created} new products/bundles.`;
    await client.query("COMMIT");
    console.log(log.trim() || "Catalogue already up to date.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  seed().then(() => closePool()).catch((e) => { console.error(e); process.exit(1); });
}
