require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zandra_admin_db',
  });

  try {
    console.log('Adding issuedDate column...');
    await connection.query(`ALTER TABLE CustomersFlights ADD COLUMN issuedDate VARCHAR(255) NULL AFTER ticketNo`);
    console.log('issuedDate added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('issuedDate column already exists.');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await connection.end();
  }
}

run();
