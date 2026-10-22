// Applies db/migrations/V*.sql in order, once each. Safe to run repeatedly.
// If this database was previously managed by Flyway (the old Spring backend), V1–V5 are
// recognised as already applied and only newer migrations (V6+) run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool, q, q1 } from "../src/db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");

export async function migrate(): Promise<string[]> {
  await q("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const files = fs.readdirSync(dir).filter((f) => /^V\d+__.*\.sql$/.test(f))
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const applied = new Set((await q<{ version: string }>("SELECT version FROM schema_migrations")).map((r) => r.version));

  if (applied.size === 0 && (await q1("SELECT to_regclass('public.flyway_schema_history') AS t"))?.t) {
    const flyway = await q<{ version: string }>("SELECT version FROM flyway_schema_history WHERE success AND version IS NOT NULL");
    for (const f of flyway) {
      const name = files.find((x) => parseInt(x.slice(1), 10) === parseInt(f.version, 10));
      if (name) { await q("INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING", [name]); applied.add(name); }
    }
    console.log(`Existing Flyway database detected — marked ${applied.size} migration(s) as already applied.`);
  }

  const ran: string[] = [];
  for (const f of files) {
    if (applied.has(f)) continue;
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(fs.readFileSync(path.join(dir, f), "utf8"));
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [f]);
      await client.query("COMMIT");
      console.log(`applied ${f}`);
      ran.push(f);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  if (!ran.length) console.log("Database schema is up to date.");
  return ran;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  migrate().then(() => closePool()).catch((e) => { console.error(e); process.exit(1); });
}
