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
    // GET - Fetch all width rules
    if (event.httpMethod === 'GET') {
      const [rows] = await connection.execute(
        'SELECT * FROM width_rules ORDER BY width ASC, sets ASC'
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    // POST - Create new width rule
    if (event.httpMethod === 'POST') {
      const { width, sets, meters } = JSON.parse(event.body);

      if (!width || !sets || !meters) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Width, sets, and meters are required' })
        };
      }

      // Validate even number for sets
      if (sets % 2 !== 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Sets must be an even number' })
        };
      }

      const [result] = await connection.execute(
        'INSERT INTO width_rules (width, sets, meters) VALUES (?, ?, ?)',
        [width, sets, meters]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, width, sets, meters }
        })
      };
    }

    // PUT - Update width rule
    if (event.httpMethod === 'PUT') {
      const { id, width, sets, meters } = JSON.parse(event.body);

      if (!id || !width || !sets || !meters) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID, width, sets, and meters are required' })
        };
      }

      // Validate even number for sets
      if (sets % 2 !== 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Sets must be an even number' })
        };
      }

      await connection.execute(
        'UPDATE width_rules SET width = ?, sets = ?, meters = ? WHERE id = ?',
        [width, sets, meters, id]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // DELETE - Delete width rule
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID is required' })
        };
      }

      await connection.execute('DELETE FROM width_rules WHERE id = ?', [id]);

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
