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
    // GET - Fetch all fabric types (with optional width filter)
    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const width = queryParams.width;

      let query = 'SELECT * FROM fabric_types';
      const params = [];

      if (width) {
        query += ' WHERE width = ?';
        params.push(width);
      }

      query += ' ORDER BY name ASC';

      const [rows] = await connection.execute(query, params);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    // POST - Create new fabric type
    if (event.httpMethod === 'POST') {
      const { name, price_per_meter, width } = JSON.parse(event.body);

      if (!name || !price_per_meter || !width) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Name, price, and width are required' })
        };
      }

      const [result] = await connection.execute(
        'INSERT INTO fabric_types (name, price_per_meter, width) VALUES (?, ?, ?)',
        [name, price_per_meter, width]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, name, price_per_meter, width }
        })
      };
    }

    // PUT - Update fabric type
    if (event.httpMethod === 'PUT') {
      const { id, name, price_per_meter, width } = JSON.parse(event.body);

      if (!id || !name || !price_per_meter || !width) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID, name, price, and width are required' })
        };
      }

      await connection.execute(
        'UPDATE fabric_types SET name = ?, price_per_meter = ?, width = ? WHERE id = ?',
        [name, price_per_meter, width, id]
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
