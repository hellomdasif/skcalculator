import { createConnection } from './db.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const connection = await createConnection();

  try {
    // GET - Fetch all width categories
    if (event.httpMethod === 'GET') {
      // First check if table exists
      try {
        const [rows] = await connection.execute(
          'SELECT * FROM width_categories ORDER BY width ASC'
        );
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: rows })
        };
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          // Table doesn't exist, create it
          await connection.execute(`
            CREATE TABLE IF NOT EXISTS width_categories (
              id INT AUTO_INCREMENT PRIMARY KEY,
              width VARCHAR(50) NOT NULL UNIQUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Insert default widths
          await connection.execute(`
            INSERT IGNORE INTO width_categories (width) VALUES ('44'), ('60')
          `);

          // Fetch again
          const [rows] = await connection.execute(
            'SELECT * FROM width_categories ORDER BY width ASC'
          );
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data: rows })
          };
        }
        throw error;
      }
    }

    // POST - Create new width category
    if (event.httpMethod === 'POST') {
      const { width } = JSON.parse(event.body);

      if (!width) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Width is required' })
        };
      }

      const [result] = await connection.execute(
        'INSERT INTO width_categories (width) VALUES (?)',
        [width]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, width }
        })
      };
    }

    // DELETE - Delete width category
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID is required' })
        };
      }

      await connection.execute('DELETE FROM width_categories WHERE id = ?', [id]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
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
      body: JSON.stringify({ success: false, error: error.message })
    };
  } finally {
    await connection.end();
  }
};
