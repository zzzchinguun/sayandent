import { Pool, type PoolConfig } from 'pg';

const globalForPg = globalThis as unknown as { pool: Pool };

// Enable SSL whenever the connection string asks for it. We accept the cert
// chain even if it's self-signed (typical for self-hosted Postgres on a VPS) —
// `pg` defaults to strict verification which breaks the handshake.
const url = process.env.DATABASE_URL ?? '';
const wantsSsl = /[?&]sslmode=(require|verify-ca|verify-full|prefer)/i.test(url);

const config: PoolConfig = {
  connectionString: url,
  max: 25,
  idleTimeoutMillis: 120000,
  ...(wantsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

export const pool = globalForPg.pool ?? new Pool(config);

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}
