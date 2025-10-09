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
      const [rows] = await connection.execute(`
        SELECT lt.*, lc.name as category_name
        FROM lace_types lt
        LEFT JOIN lace_categories lc ON lt.category_id = lc.id
        ORDER BY lc.name ASC, lt.name ASC
      `);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: rows })
      };
    }

    if (event.httpMethod === 'POST') {
      const { category_id, name, price } = JSON.parse(event.body);
      if (!category_id || !name || !price) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Category, name and price are required' })
        };
      }
      const [result] = await connection.execute(
        'INSERT INTO lace_types (category_id, name, price) VALUES (?, ?, ?)',
        [category_id, name, price]
      );
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { id: result.insertId, category_id, name, price }
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { id, category_id, name, price } = JSON.parse(event.body);
      if (!id || !category_id || !name || !price) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'ID, category, name and price are required' })
        };
      }
      await connection.execute(
        'UPDATE lace_types SET category_id = ?, name = ?, price = ? WHERE id = ?',
        [category_id, name, price, id]
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
      await connection.execute('DELETE FROM lace_types WHERE id = ?', [id]);
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
