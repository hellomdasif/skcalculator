import { createConnection } from './db.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const connection = await createConnection();

  try {
    // GET - Fetch all brooch categories
    if (event.httpMethod === 'GET') {
      const [rows] = await connection.execute(
        'SELECT * FROM brooch_categories ORDER BY name ASC'
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    // POST - Create new brooch category
    if (event.httpMethod === 'POST') {
      const { name } = JSON.parse(event.body);

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Name is required' })
        };
      }

      const [result] = await connection.execute(
        'INSERT INTO brooch_categories (name) VALUES (?)',
        [name]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, name }
        })
      };
    }

    // PUT - Update brooch category
    if (event.httpMethod === 'PUT') {
      const { id, name } = JSON.parse(event.body);

      if (!id || !name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID and name are required' })
        };
      }

      await connection.execute(
        'UPDATE brooch_categories SET name = ? WHERE id = ?',
        [name, id]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // DELETE - Delete brooch category
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID is required' })
        };
      }

      await connection.execute('DELETE FROM brooch_categories WHERE id = ?', [id]);

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
