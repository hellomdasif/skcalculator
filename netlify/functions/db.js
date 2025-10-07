import mysql from 'mysql2/promise';

let connection = null;

export async function getConnection() {
  if (connection) {
    return connection;
  }

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '172.105.49.22',
      user: process.env.DB_USER || 'dsfsdfds_n8n',
      password: process.env.DB_PASSWORD || 'Mdlove@123',
      database: process.env.DB_NAME || 'dsfsdfds_n8n',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
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
