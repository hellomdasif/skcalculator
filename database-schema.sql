-- SK Enterprise Database Schema
-- Drop old table
DROP TABLE IF EXISTS items;

-- Fabric Types Table
CREATE TABLE IF NOT EXISTS fabric_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_per_meter DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- Brooch Types Table
CREATE TABLE IF NOT EXISTS brooch_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- Width Rules Table (for fabric meter calculation)
CREATE TABLE IF NOT EXISTS width_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  width INT NOT NULL,
  sets INT NOT NULL,
  meters DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_width_sets (width, sets),
  INDEX idx_width (width)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(200) NOT NULL,
  invoice_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_name),
  INDEX idx_date (invoice_date)
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  item_type ENUM('fabric', 'brooch', 'labour', 'extra') NOT NULL,
  fabric_type_id INT NULL,
  brooch_type_id INT NULL,
  width INT NULL,
  sets INT NULL,
  meters DECIMAL(10, 2) NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (fabric_type_id) REFERENCES fabric_types(id) ON DELETE SET NULL,
  FOREIGN KEY (brooch_type_id) REFERENCES brooch_types(id) ON DELETE SET NULL,
  INDEX idx_invoice (invoice_id),
  INDEX idx_item_type (item_type)
);

-- Insert default width rules
INSERT INTO width_rules (width, sets, meters) VALUES
(60, 2, 3.0),
(60, 4, 4.0),
(60, 6, 5.0),
(60, 8, 6.0),
(44, 2, 4.0),
(44, 4, 5.0),
(44, 6, 6.0),
(44, 8, 7.0);

-- Sample data for fabric types
INSERT INTO fabric_types (name, price_per_meter) VALUES
('Cotton', 150.00),
('Silk', 500.00),
('Linen', 300.00);

-- Sample data for brooch types
INSERT INTO brooch_types (name, price) VALUES
('Small Brooch', 50.00),
('Medium Brooch', 100.00),
('Large Brooch', 150.00);
