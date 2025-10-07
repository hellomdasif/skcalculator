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
    // GET - Fetch all fabric types
    if (event.httpMethod === 'GET') {
      const [rows] = await connection.execute(
        'SELECT * FROM fabric_types ORDER BY name ASC'
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    // POST - Create new fabric type
    if (event.httpMethod === 'POST') {
      const { name, price_per_meter } = JSON.parse(event.body);

      if (!name || !price_per_meter) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Name and price are required' })
        };
      }

      const [result] = await connection.execute(
        'INSERT INTO fabric_types (name, price_per_meter) VALUES (?, ?)',
        [name, price_per_meter]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, name, price_per_meter }
        })
      };
    }

    // PUT - Update fabric type
    if (event.httpMethod === 'PUT') {
      const { id, name, price_per_meter } = JSON.parse(event.body);

      if (!id || !name || !price_per_meter) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID, name and price are required' })
        };
      }

      await connection.execute(
        'UPDATE fabric_types SET name = ?, price_per_meter = ? WHERE id = ?',
        [name, price_per_meter, id]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // DELETE - Delete fabric type
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID is required' })
        };
      }

      await connection.execute('DELETE FROM fabric_types WHERE id = ?', [id]);

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
