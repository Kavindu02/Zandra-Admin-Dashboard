const pool = require('../models/db');

async function updateUsersTable() {
  try {
    const columns = [
      { name: 'phone', type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'email', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'cv_path', type: 'VARCHAR(500) DEFAULT NULL' },
      { name: 'agreement1_path', type: 'VARCHAR(500) DEFAULT NULL' },
      { name: 'agreement2_path', type: 'VARCHAR(500) DEFAULT NULL' }
    ];

    for (const col of columns) {
      const [rows] = await pool.query(`SHOW COLUMNS FROM auth_users LIKE '${col.name}'`);
      if (rows.length === 0) {
        await pool.query(`ALTER TABLE auth_users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} column to auth_users`);
      } else {
        console.log(`${col.name} column already exists in auth_users`);
      }
    }

  } catch (err) {
    console.error('Error updating auth_users table:', err);
  } finally {
    process.exit(0);
  }
}

updateUsersTable();
