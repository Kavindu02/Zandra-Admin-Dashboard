const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zandra_admin_panel'
  });

  console.log('Connected to database.');

  const createPassengersTableQuery = `
    CREATE TABLE IF NOT EXISTS passengers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      passport VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await connection.query(createPassengersTableQuery);
  console.log('Table "passengers" checked/created.');

  const createExpensesTableQuery = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      category VARCHAR(255) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      payment_method VARCHAR(100),
      description TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await connection.query(createExpensesTableQuery);
  console.log('Table "expenses" checked/created.');

  const createReceivablesTableQuery = `
    CREATE TABLE IF NOT EXISTS receivables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      category VARCHAR(255) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      payment_method VARCHAR(100),
      description TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await connection.query(createReceivablesTableQuery);
  console.log('Table "receivables" checked/created.');

  const createPayablesTableQuery = `
    CREATE TABLE IF NOT EXISTS payables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      category VARCHAR(255) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      payment_method VARCHAR(100),
      reason TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await connection.query(createPayablesTableQuery);
  console.log('Table "payables" checked/created.');

  const createEmployeesTableQuery = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await connection.query(createEmployeesTableQuery);
  console.log('Table "employees" checked/created.');

  // Optional: Update CustomersFlights to include passenger_id if not exists
  const addColumnQuery = `
    ALTER TABLE CustomersFlights 
    ADD COLUMN IF NOT EXISTS passenger_id INT AFTER id;
  `;
  
  try {
    await connection.query(addColumnQuery);
    console.log('Column "passenger_id" added to CustomersFlights (if not existed).');
  } catch (err) {
    // If ADD COLUMN IF NOT EXISTS is not supported (MySQL < 8.0.19)
    console.log('Attempting to add column manually...');
    try {
      await connection.query('ALTER TABLE CustomersFlights ADD COLUMN passenger_id INT AFTER id');
    } catch (e) {
      console.log('Column might already exist.');
    }
  }

  await connection.end();
}

init().catch(console.error);
