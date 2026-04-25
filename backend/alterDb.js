const pool = require('./models/db');
async function alterDb() {
  try {
    const [rows, fields] = await pool.query("SHOW COLUMNS FROM CustomersFlights LIKE 'airlineLogo'");
    if (rows.length === 0) {
      await pool.query("ALTER TABLE CustomersFlights ADD COLUMN airlineLogo VARCHAR(500) DEFAULT NULL");
      console.log('Added airlineLogo column');
    } else {
      console.log('Column already exists');
    }
  } catch (err) {
    console.error('Error altering DB', err);
  } finally {
    process.exit(0);
  }
}
alterDb();
