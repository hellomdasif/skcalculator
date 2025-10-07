import { getConnection, initDatabase } from './db.js';

export async function handler(event, context) {
  // Set headers for CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Initialize database and tables
    await initDatabase();

    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM items ORDER BY created_at DESC'
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        items: rows
      })
    };
  } catch (error) {
    console.error('Error fetching items:', error);
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
