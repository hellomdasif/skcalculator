// Complete database setup script for dsfsdfds_sk database
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '172.105.49.22',
    user: process.env.DB_USER || 'dsfsdfds_sk',
    password: process.env.DB_PASSWORD || 'Mdlove@123',
    database: process.env.DB_NAME || 'dsfsdfds_sk'
  });

  try {
    console.log('🔌 Connected to database: dsfsdfds_sk\n');

    // 1. Fabric Types Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fabric_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        width INT NOT NULL DEFAULT 44,
        price_per_meter DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_width (width)
      )
    `);
    console.log('✅ fabric_types table created');

    // 2. Brooch Categories Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS brooch_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ brooch_categories table created');

    // 3. Brooch Types Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS brooch_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES brooch_categories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ brooch_types table created');

    // 4. Lace Categories Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lace_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ lace_categories table created');

    // 5. Lace Types Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lace_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES lace_categories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ lace_types table created');

    // 6. Extra Charges Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS extra_charges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ extra_charges table created');

    // 7. Width Rules Table (Updated with lace_rolls field)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS width_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        width INT NOT NULL,
        sets INT NOT NULL,
        meters DECIMAL(10,2) NOT NULL,
        lace_rolls INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_width_sets (width, sets)
      )
    `);
    console.log('✅ width_rules table created');

    // 8. Invoices Table (for history)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(200),
        invoice_date DATE,
        total DECIMAL(10,2) NOT NULL,
        items_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ invoices table created');

    // Insert sample data
    console.log('\n📝 Inserting sample data...\n');

    // Sample Brooch Categories
    await connection.execute(`
      INSERT IGNORE INTO brooch_categories (name) VALUES
      ('Heavy'), ('Light'), ('Medium')
    `);
    console.log('✅ Sample brooch categories added');

    // Sample Lace Categories
    await connection.execute(`
      INSERT IGNORE INTO lace_categories (name) VALUES
      ('V Heavy'), ('Heavy'), ('Light')
    `);
    console.log('✅ Sample lace categories added');

    // Sample Extra Charges
    await connection.execute(`
      INSERT IGNORE INTO extra_charges (name, price) VALUES
      ('Foam', 100.00),
      ('Paper', 320.00),
      ('Making Charge', 500.00)
    `);
    console.log('✅ Sample extra charges added');

    // Sample Width Rules
    await connection.execute(`
      INSERT IGNORE INTO width_rules (width, sets, meters, lace_rolls) VALUES
      (60, 3, 5.5, 2),
      (44, 3, 4.5, 2)
    `);
    console.log('✅ Sample width rules added');

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📊 Database Structure:');
    console.log('  - fabric_types (name, width, price_per_meter)');
    console.log('  - brooch_categories → brooch_types (category-based)');
    console.log('  - lace_categories → lace_types (category-based)');
    console.log('  - extra_charges (name, price)');
    console.log('  - width_rules (width, sets, meters, lace_rolls)');
    console.log('  - invoices (customer_name, total, items_json)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

setupDatabase().catch(console.error);
