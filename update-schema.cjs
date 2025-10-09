// Add width column to fabric_types table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '172.105.49.22',
    user: process.env.DB_USER || 'dsfsdfds_sk',
    password: process.env.DB_PASSWORD || 'Mdlove@123',
    database: process.env.DB_NAME || 'dsfsdfds_sk'
  });

  try {
    console.log('Connected to database...');

    // Check if width column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'fabric_types'
      AND COLUMN_NAME = 'width'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (columns.length === 0) {
      console.log('Adding width column to fabric_types...');
      await connection.query(`
        ALTER TABLE fabric_types
        ADD COLUMN width INT NOT NULL DEFAULT 44 AFTER name
      `);
      console.log('✅ Width column added!');
    } else {
      console.log('✅ Width column already exists!');
    }

    console.log('✅ Width column added successfully!');

    // Show updated structure
    const [rows] = await connection.query('DESCRIBE fabric_types');
    console.log('\nUpdated fabric_types structure:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateSchema();
