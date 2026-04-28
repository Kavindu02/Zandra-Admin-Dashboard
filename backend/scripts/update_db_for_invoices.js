const db = require('../models/db');

async function updateDatabase() {
  try {
    console.log('Updating CustomersFlights table...');
    
    // Add columns to CustomersFlights
    const alterQueries = [
      "ALTER TABLE CustomersFlights ADD COLUMN travelDate DATE NULL",
      "ALTER TABLE CustomersFlights ADD COLUMN destination VARCHAR(255) NULL",
      "ALTER TABLE CustomersFlights ADD COLUMN invoiceStatus ENUM('Pending', 'Approve') DEFAULT 'Pending'"
    ];

    for (const query of alterQueries) {
      try {
        await db.query(query);
        console.log(`Executed: ${query}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists, skipping: ${query}`);
        } else {
          throw err;
        }
      }
    }

    console.log('Creating invoices table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS Invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoiceNo VARCHAR(50) UNIQUE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        qty INT NOT NULL,
        itemService VARCHAR(255) DEFAULT 'Cost for the air ticket',
        status ENUM('Pending', 'Approve') DEFAULT 'Pending',
        customerFlightIds JSON NOT NULL,
        handledBy VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        dateIssued DATE NULL,
        travelDate DATE NULL,
        destination VARCHAR(255) NULL,
        billToName VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Invoices table created or already exists.');

    process.exit(0);
  } catch (err) {
    console.error('Database update failed:', err);
    process.exit(1);
  }
}

updateDatabase();
