// Setup database tables
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Connected to database...');

    const schema = fs.readFileSync('./database-schema.sql', 'utf8');

    console.log('Creating tables...');
    await connection.query(schema);

    console.log('✅ Database schema created successfully!');
    console.log('Tables created:');
    console.log('  - fabric_types');
    console.log('  - brooch_types');
    console.log('  - width_rules');
    console.log('  - invoices');
    console.log('  - invoice_items');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

setupDatabase();
