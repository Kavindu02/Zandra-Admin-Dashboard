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

  try {
    await connection.query('ALTER TABLE CustomersFlights ADD COLUMN airlineRef VARCHAR(255) AFTER pnr');
    console.log('Column "airlineRef" added to CustomersFlights');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('airlineRef already exists');
    else console.error(e);
  }

  try {
    await connection.query('ALTER TABLE CustomersFlights ADD COLUMN baggage VARCHAR(255) AFTER status');
    console.log('Column "baggage" added to CustomersFlights');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('baggage already exists');
    else console.error(e);
  }

  try {
    await connection.query('ALTER TABLE CustomersFlights ADD COLUMN fareBasis VARCHAR(255) AFTER baggage');
    console.log('Column "fareBasis" added to CustomersFlights');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('fareBasis already exists');
    else console.error(e);
  }

  await connection.end();
}

init().catch(console.error);
