const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zandra_admin_panel'
  });

  console.log('Migrating data...');

  // Get unique passengers from CustomersFlights
  const [flights] = await connection.query('SELECT DISTINCT passenger, passport, email, phone FROM CustomersFlights');
  
  for (const flight of flights) {
    if (!flight.passenger) continue;

    // Check if already in passengers
    const [existing] = await connection.query('SELECT id FROM passengers WHERE name = ? AND (passport = ? OR email = ?)', [flight.passenger, flight.passport, flight.email]);
    
    let passengerId;
    if (existing.length > 0) {
      passengerId = existing[0].id;
    } else {
      const [result] = await connection.query(
        'INSERT INTO passengers (name, passport, email, phone) VALUES (?, ?, ?, ?)',
        [flight.passenger, flight.passport, flight.email, flight.phone]
      );
      passengerId = result.insertId;
    }

    // Update CustomersFlights
    await connection.query('UPDATE CustomersFlights SET passenger_id = ? WHERE passenger = ? AND (passport = ? OR email = ?)', [passengerId, flight.passenger, flight.passport, flight.email]);
  }

  console.log('Migration complete.');
  await connection.end();
}

migrate().catch(console.error);
