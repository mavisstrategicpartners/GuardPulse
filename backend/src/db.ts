import pg from "pg";
import { config } from "./config.js";

// NUMERIC -> number (prices/weights are small, 2-3 dp; money maths is done in integer cents).
pg.types.setTypeParser(1700, (v) => parseFloat(v));
// BIGINT -> number (ids, versions) — well within 2^53.
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const url = config().databaseUrl;
    if (!url) throw new Error("DATABASE_URL is not set");
    const local = /localhost|127\.0\.0\.1/.test(url);
    pool = new pg.Pool({
      connectionString: url,
      // Serverless: each instance holds very few connections; use the provider's pooled URL.
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: local ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function closePool() {
  await pool?.end();
  pool = null;
}

type Queryable = Pick<pg.Pool | pg.PoolClient, "query">;

export async function q<T = any>(sql: string, params: unknown[] = [], db: Queryable = getPool()): Promise<T[]> {
  const res = await db.query(sql, params as any[]);
  return res.rows as T[];
}

export async function q1<T = any>(sql: string, params: unknown[] = [], db: Queryable = getPool()): Promise<T | null> {
  return (await q<T>(sql, params, db))[0] ?? null;
}

export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore */ }
    throw e;
  } finally {
    client.release();
  }
}
