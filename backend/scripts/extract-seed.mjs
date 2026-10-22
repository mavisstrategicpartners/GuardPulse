// One-off: turns the Java seeders' `new Seed(...)` literals into JSON so the catalogue wording
// survives the port exactly. Usage: node scripts/extract-seed.mjs <DataSeeder.java> <CatalogExpansionSeeder.java>
import fs from "node:fs";

function tokenize(src) {
  const toks = []; let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (src.startsWith("//", i)) { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (src.startsWith("/*", i)) { i = src.indexOf("*/", i) + 2; continue; }
    if (ch === '"') {
      let s = ""; i++;
      while (src[i] !== '"') {
        if (src[i] === "\\") {
          const n = src[i + 1];
          const map = { n: "\n", t: "\t", '"': '"', "\\": "\\", "'": "'" };
          if (n === "u") { s += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16)); i += 6; continue; }
          s += map[n] ?? n; i += 2;
        } else { s += src[i++]; }
      }
      i++; toks.push({ t: "str", v: s }); continue;
    }
    if (/[A-Za-z_]/.test(ch)) { let j = i; while (/[\w.]/.test(src[j])) j++; toks.push({ t: "id", v: src.slice(i, j) }); i = j; continue; }
    if (/[0-9]/.test(ch)) { let j = i; while (/[0-9._]/.test(src[j])) j++; toks.push({ t: "num", v: src.slice(i, j) }); i = j; continue; }
    toks.push({ t: "p", v: ch }); i++;
  }
  return toks;
}

function parseSeeds(file) {
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf("static List<Seed> catalog()");
  const toks = tokenize(src.slice(start));
  let p = 0;
  const peek = () => toks[p];
  const expr = () => {
    // concatenation of primaries joined by +
    let v = primary();
    while (peek()?.t === "p" && peek().v === "+") { p++; v = v + primary(); }
    return v;
  };
  const primary = () => {
    const t = toks[p++];
    if (t.t === "str") return t.v;
    if (t.t === "num") return Number(t.v);
    if (t.t === "id" && (t.v === "true" || t.v === "false")) return t.v === "true";
    if (t.t === "id" && t.v === "new") {
      const type = toks[p++].v;
      if (type === "String") { // new String[]{ ... }
        p += 2; // [ ]
        p++;    // {
        const arr = [];
        while (!(peek().t === "p" && peek().v === "}")) { arr.push(expr()); if (peek().v === ",") p++; }
        p++; return arr;
      }
    }
    throw new Error("Unexpected token " + JSON.stringify(t));
  };
  const seeds = [];
  for (; p < toks.length; p++) {
    if (toks[p].v === "new" && toks[p + 1]?.v === "Seed" && toks[p + 2]?.v === "(") {
      p += 3; const args = [];
      while (toks[p].v !== ")") { args.push(expr()); if (toks[p].v === ",") p++; }
      seeds.push(args);
    }
  }
  return seeds;
}

const [dataSeeder, expansion] = process.argv.slice(2);

// DataSeeder.Seed(slug, name, brand, category, bundle, sku, costPrice, price, tagline, description, specs[], weightKg)
const core = parseSeeds(dataSeeder).map((a) => ({
  slug: a[0], name: a[1], brand: a[2], category: a[3], bundle: a[4], sku: a[5],
  cost_price: a[6], price: a[7], tagline: a[8], description: a[9], specs: a[10], weight_kg: a[11],
}));
// Expansion.Seed(slug, name, brand, categoryKey, categoryLabel, bundle, sku, price, stockQty, tagline, description, specs[], weightKg)
const exp = parseSeeds(expansion).map((a) => ({
  slug: a[0], name: a[1], brand: a[2], category: a[3], category_label: a[4], bundle: a[5], sku: a[6],
  price: a[7], stock_qty: a[8], tagline: a[9], description: a[10], specs: a[11], weight_kg: a[12],
}));
fs.mkdirSync("src/seed", { recursive: true });
fs.writeFileSync("src/seed/core.json", JSON.stringify(core, null, 2));
fs.writeFileSync("src/seed/expansion.json", JSON.stringify(exp, null, 2));
console.log(`core=${core.length} expansion=${exp.length}`);
