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
    if (event.httpMethod === 'GET') {
      const [rows] = await connection.execute(
        'SELECT * FROM extra_charges ORDER BY name ASC'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    if (event.httpMethod === 'POST') {
      const { name, price } = JSON.parse(event.body);
      if (!name || !price) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Name and price are required' })
        };
      }
      const [result] = await connection.execute(
        'INSERT INTO extra_charges (name, price) VALUES (?, ?)',
        [name, price]
      );
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, name, price }
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, price } = JSON.parse(event.body);
      if (!id || !name || !price) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID, name and price are required' })
        };
      }
      await connection.execute(
        'UPDATE extra_charges SET name = ?, price = ? WHERE id = ?',
        [name, price, id]
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID is required' })
        };
      }
      await connection.execute('DELETE FROM extra_charges WHERE id = ?', [id]);
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
