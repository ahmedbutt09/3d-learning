import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Postgres in production (DATABASE_URL set), SQLite file locally.
export const isPg = Boolean(process.env.DATABASE_URL);

let pool;
let sqlite;

export async function initDb() {
  if (isPg) {
    const pg = (await import('pg')).default;
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    });
    await pool.query('SELECT 1');
    console.log('Database: PostgreSQL');
  } else {
    const { DatabaseSync } = await import('node:sqlite');
    const file = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data.db');
    sqlite = new DatabaseSync(file);
    sqlite.exec('PRAGMA journal_mode = WAL;');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    console.log('Database: SQLite at', file);
  }
}

function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function camel(row) {
  if (!row) return row;
  const out = {};
  for (const k of Object.keys(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = row[k];
  }
  return out;
}

// Always returns an array of camelCased rows (empty for statements without results).
export async function query(sql, params = []) {
  if (isPg) {
    const res = await pool.query(toPg(sql), params);
    return (res.rows || []).map(camel);
  }
  const cleanSql = sql.trim();
  const upper = cleanSql.toUpperCase();
  if (upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA')) {
    const stmt = sqlite.prepare(cleanSql);
    return stmt.all(...params).map(camel);
  }
  if (params.length === 0) {
    sqlite.exec(cleanSql);
    return [];
  }
  const stmt = sqlite.prepare(cleanSql);
  stmt.run(...params);
  return [];
}

export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
