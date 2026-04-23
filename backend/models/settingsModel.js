const pool = require('./db');

const ensureSettingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value LONGTEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Initialize default payroll rates if not exist
  const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key = "payroll_rates"');
  if (rows.length === 0) {
    await pool.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
      ['payroll_rates', JSON.stringify({ epfEmployee: 8, epfEmployer: 12, etfEmployer: 3 })]
    );
  }
};

const getPayrollSettings = async () => {
  await ensureSettingsTable();
  const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "payroll_rates"');
  if (rows[0] && rows[0].setting_value) {
    try {
      return typeof rows[0].setting_value === 'string' 
        ? JSON.parse(rows[0].setting_value) 
        : rows[0].setting_value;
    } catch (e) {
      console.error('Failed to parse settings JSON:', e);
      return { epfEmployee: 8, epfEmployer: 12, etfEmployer: 3 };
    }
  }
  return { epfEmployee: 8, epfEmployer: 12, etfEmployer: 3 };
};

const updatePayrollSettings = async (rates) => {
  await ensureSettingsTable();
  await pool.query(
    'UPDATE settings SET setting_value = ? WHERE setting_key = "payroll_rates"',
    [JSON.stringify(rates)]
  );
};

module.exports = {
  getPayrollSettings,
  updatePayrollSettings
};
