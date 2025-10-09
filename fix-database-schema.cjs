// Fix database schema - simplify brooch and lace to categories only
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '172.105.49.22',
    user: process.env.DB_USER || 'dsfsdfds_sk',
    password: process.env.DB_PASSWORD || 'Mdlove@123',
    database: process.env.DB_NAME || 'dsfsdfds_sk'
  });

  try {
    console.log('🔌 Connected to database: dsfsdfds_sk\n');

    // Drop types tables (we don't need them)
    console.log('Dropping brooch_types and lace_types tables...');
    await connection.execute('DROP TABLE IF EXISTS brooch_types');
    await connection.execute('DROP TABLE IF EXISTS lace_types');
    console.log('✅ Types tables dropped\n');

    // Add price column to brooch_categories
    console.log('Adding price to brooch_categories...');
    try {
      await connection.execute(`
        ALTER TABLE brooch_categories
        ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER name
      `);
      console.log('✅ Price column added to brooch_categories');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Price column already exists in brooch_categories');
      } else {
        throw error;
      }
    }

    // Add price column to lace_categories
    console.log('Adding price to lace_categories...');
    try {
      await connection.execute(`
        ALTER TABLE lace_categories
        ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER name
      `);
      console.log('✅ Price column added to lace_categories');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Price column already exists in lace_categories');
      } else {
        throw error;
      }
    }

    // Update sample data
    console.log('\n📝 Updating sample data...');
    await connection.execute(`
      UPDATE brooch_categories SET price = 75.00 WHERE name = 'Heavy'
    `);
    await connection.execute(`
      UPDATE brooch_categories SET price = 30.00 WHERE name = 'Light'
    `);
    await connection.execute(`
      UPDATE brooch_categories SET price = 50.00 WHERE name = 'Medium'
    `);
    console.log('✅ Brooch categories updated with prices');

    await connection.execute(`
      UPDATE lace_categories SET price = 150.00 WHERE name = 'V Heavy'
    `);
    await connection.execute(`
      UPDATE lace_categories SET price = 120.00 WHERE name = 'Heavy'
    `);
    await connection.execute(`
      UPDATE lace_categories SET price = 80.00 WHERE name = 'Light'
    `);
    console.log('✅ Lace categories updated with prices');

    console.log('\n✨ Schema fixed successfully!');
    console.log('\n📊 Current Structure:');
    console.log('  - brooch_categories (name, price)');
    console.log('  - lace_categories (name, price)');
    console.log('  - No more "types" tables!');

    // Show data
    const [brooches] = await connection.execute('SELECT * FROM brooch_categories');
    console.log('\n🔹 Brooch Categories:');
    console.table(brooches);

    const [laces] = await connection.execute('SELECT * FROM lace_categories');
    console.log('🔹 Lace Categories:');
    console.table(laces);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSchema().catch(console.error);
