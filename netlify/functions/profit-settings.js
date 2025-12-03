import { createConnection } from './db.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let conn;
  try {
    conn = await createConnection();

    const driver = (process.env.DB_DRIVER || 'mysql').toLowerCase();
    const profitTableSql =
      driver === 'postgres'
        ? `
      CREATE TABLE IF NOT EXISTS profit_settings (
        id SERIAL PRIMARY KEY,
        profit_type VARCHAR(20) NOT NULL DEFAULT 'none',
        profit_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `
        : `
      CREATE TABLE IF NOT EXISTS profit_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profit_type VARCHAR(20) NOT NULL DEFAULT 'none',
        profit_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    // Ensure profit_settings table exists (supports MySQL & Postgres)
    await conn.execute(profitTableSql);

    // GET - Fetch current profit settings
    if (event.httpMethod === 'GET') {
      const [rows] = await conn.execute('SELECT * FROM profit_settings ORDER BY id DESC LIMIT 1');

      if (rows.length === 0) {
        // Insert default settings if none exist
        await conn.execute(
          'INSERT INTO profit_settings (profit_type, profit_value) VALUES (?, ?)',
          ['none', 0]
        );
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: { profit_type: 'none', profit_value: 0 }
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            profit_type: rows[0].profit_type,
            profit_value: parseFloat(rows[0].profit_value)
          }
        })
      };
    }

    // POST - Update profit settings
    if (event.httpMethod === 'POST') {
      const { profit_type, profit_value } = JSON.parse(event.body);

      // Check if settings exist
      const [existing] = await conn.execute('SELECT id FROM profit_settings LIMIT 1');

      if (existing.length === 0) {
        // Insert new settings
        await conn.execute(
          'INSERT INTO profit_settings (profit_type, profit_value) VALUES (?, ?)',
          [profit_type, profit_value]
        );
      } else {
        // Update existing settings
        const updateQuery =
          driver === 'postgres'
            ? 'UPDATE profit_settings SET profit_type = ?, profit_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            : 'UPDATE profit_settings SET profit_type = ?, profit_value = ? WHERE id = ?';

        await conn.execute(updateQuery, [profit_type, profit_value, existing[0].id]);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Profit settings updated successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  } finally {
    if (conn) await conn.end();
  }
};
