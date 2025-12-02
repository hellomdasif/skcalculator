import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import os from 'os';
import pg from 'pg';

const { Pool } = pg;

let sqliteDb; // cached SQLite connection for local/file-based mode
let sqliteInitialized = false;
let pgPool; // cached Postgres pool

async function ensureColumn(db, table, column, typeSql) {
  const info = await db.all(`PRAGMA table_info(${table})`);
  const hasColumn = info.some((col) => col.name === column);
  if (!hasColumn) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeSql}`);
  }
}

async function createSqliteConnection() {
  const filename =
    process.env.SQLITE_PATH ||
    ((process.env.NETLIFY || process.env.VERCEL)
      ? path.join(os.tmpdir(), 'local.db')
      : path.join(process.cwd(), 'local.db'));
  if (!sqliteDb) {
    sqliteDb = await open({
      filename,
      driver: sqlite3.Database
    });
  }
  if (!sqliteInitialized) {
    await ensureSqliteSchema(sqliteDb);
    sqliteInitialized = true;
  }

  // Provide a minimal MySQL-like interface (execute + end) so existing handlers keep working
  return {
    execute: async (sql, params = []) => {
      const trimmed = sql.trim().toLowerCase();
      if (trimmed.startsWith('select')) {
        const rows = await sqliteDb.all(sql, params);
        return [rows];
      }
      const result = await sqliteDb.run(sql, params);
      return [
        {
          insertId: result.lastID,
          affectedRows: result.changes
        }
      ];
    },
    end: async () => {
      // keep the shared connection open for reuse
    }
  };
}

async function ensureSqliteSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fabric_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      width INTEGER NOT NULL DEFAULT 44,
      price_per_meter REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brooch_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brooch_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES brooch_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lace_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      price REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lace_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES lace_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extra_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS width_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      width INTEGER NOT NULL,
      sets INTEGER NOT NULL,
      meters REAL NOT NULL,
      lace_rolls INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (width, sets)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      invoice_date DATE,
      total REAL NOT NULL,
      items_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profit_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profit_type TEXT NOT NULL DEFAULT 'none',
      profit_value REAL NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Backfill missing columns if the DB file already existed
  await ensureColumn(db, 'lace_categories', 'price', 'REAL NOT NULL DEFAULT 0');
}

async function createPostgresConnection() {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing database env vars: ${missing.join(', ')}`);
  }

  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });
  }

  const convertPlaceholders = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  };

  return {
    execute: async (sql, params = []) => {
      const trimmed = sql.trim().toLowerCase();
      const isInsert = trimmed.startsWith('insert') && !/returning\s+/i.test(sql);
      const finalSql = isInsert ? `${sql} RETURNING id` : sql;
      const text = convertPlaceholders(finalSql);
      const res = await pgPool.query(text, params);

      if (trimmed.startsWith('select')) {
        return [res.rows];
      }

      // mimic mysql2 shape
      return [
        {
          insertId: res.rows?.[0]?.id,
          affectedRows: res.rowCount
        }
      ];
    },
    end: async () => {
      // keep pool alive for reuse
    }
  };
}

export async function createConnection() {
  const driver = (process.env.DB_DRIVER || 'mysql').toLowerCase();

  if (driver === 'sqlite') {
    return createSqliteConnection();
  }

  if (driver === 'postgres') {
    return createPostgresConnection();
  }

  // Fail fast if required env vars are missing to avoid using stale hardcoded defaults
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing database env vars: ${missing.join(', ')}`);
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Legacy export for old functions
export async function getConnection() {
  return await createConnection();
}

export async function initDatabase() {
  const conn = await getConnection();

  // Create items table if it doesn't exist
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables initialized');
}
