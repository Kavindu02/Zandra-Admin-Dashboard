require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'zandra',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Adding returnSegments column to CustomersFlights table...');
        await pool.query(`
            ALTER TABLE CustomersFlights
            ADD COLUMN returnSegments JSON NULL AFTER segments;
        `);
        console.log('Migration successful: added returnSegments.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column returnSegments already exists.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        await pool.end();
    }
}

migrate();
