import mysql from 'mysql2/promise';
import path from 'path';
import os from 'os';
import pg from 'pg';

const { Pool } = pg;

let pgPool; // cached Postgres pool

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
    // SQLite disabled for this build; app uses localStorage instead.
    throw new Error('SQLite driver disabled; set DB_DRIVER=mysql or postgres, or switch to LOCAL_ONLY UI mode.');
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
