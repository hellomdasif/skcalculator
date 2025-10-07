import { getConnection, initDatabase } from './db.js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { name, price } = JSON.parse(event.body);

    // Validation
    if (!name || !price) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Name and price are required'
        })
      };
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Price must be a positive number'
        })
      };
    }

    // Initialize database and tables
    await initDatabase();

    const connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO items (name, price) VALUES (?, ?)',
      [name.trim(), parseFloat(price)]
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        item: {
          id: result.insertId,
          name: name.trim(),
          price: parseFloat(price)
        }
      })
    };
  } catch (error) {
    console.error('Error adding item:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}
