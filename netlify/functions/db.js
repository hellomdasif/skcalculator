import mysql from 'mysql2/promise';

export async function createConnection() {
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
