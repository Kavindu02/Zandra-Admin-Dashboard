const db = require('./db');

const ensureDashboardSettingsTable = async () => {
  await db.query(
    'CREATE TABLE IF NOT EXISTS dashboard_settings (id INT PRIMARY KEY, activeEmployees INT DEFAULT 0, monthlyProfit DECIMAL(12,2) DEFAULT 0, totalProfit DECIMAL(12,2) DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)'
  );

  const [rows] = await db.query('SELECT id FROM dashboard_settings WHERE id = 1');
  if (!rows.length) {
    await db.query(
      'INSERT INTO dashboard_settings (id, activeEmployees, monthlyProfit, totalProfit) VALUES (1, 0, 0, 0)'
    );
  }
};

const safeScalar = async (query, params = [], key = 'total') => {
  try {
    const [rows] = await db.query(query, params);
    return Number(rows?.[0]?.[key] || 0);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return 0;
    }
    throw err;
  }
};

const safeRow = async (query, params = []) => {
  try {
    const [rows] = await db.query(query, params);
    return rows?.[0] || null;
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return null;
    }
    throw err;
  }
};

exports.getDashboardSettings = async () => {
  await ensureDashboardSettingsTable();
  const [rows] = await db.query('SELECT * FROM dashboard_settings WHERE id = 1');
  return rows[0];
};

exports.updateDashboardSettings = async (data) => {
  await ensureDashboardSettingsTable();
  await db.query(
    'UPDATE dashboard_settings SET activeEmployees = ?, monthlyProfit = ?, totalProfit = ? WHERE id = 1',
    [data.activeEmployees, data.monthlyProfit, data.totalProfit]
  );

  return exports.getDashboardSettings();
};

exports.getDashboardSummary = async () => {
  await ensureDashboardSettingsTable();

  const settings = await exports.getDashboardSettings();
  const totalCustomers = await safeScalar('SELECT COUNT(*) AS total FROM CustomersFlights');
  const todaysFlights = await safeScalar('SELECT COUNT(*) AS total FROM CustomersFlights WHERE departureDate = CURDATE()');
  const totalInvoices = await safeScalar("SELECT COUNT(*) AS total FROM CustomersFlights WHERE invoiceNo IS NOT NULL AND invoiceNo <> ''");
  const unreadAlerts = await safeScalar('SELECT COUNT(*) AS total FROM notifications WHERE isRead = 0');
  const pendingReminders = await safeScalar("SELECT COUNT(*) AS total FROM notifications WHERE type = 'reminder' AND isRead = 0");
  const flightsIn48h = await safeScalar(
    "SELECT COUNT(*) AS total FROM CustomersFlights WHERE departureDate IS NOT NULL AND TIMESTAMP(departureDate, IFNULL(NULLIF(departureTime, ''), '00:00:00')) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)"
  );

  const recentPassenger = await safeRow(
    "SELECT passenger, invoiceNo, status FROM CustomersFlights ORDER BY id DESC LIMIT 1"
  );

  const recentReminder = await safeRow(
    "SELECT title, message, isRead, created_at FROM notifications ORDER BY created_at DESC, id DESC LIMIT 1"
  );

  return {
    totalCustomers,
    todaysFlights,
    pendingReminders,
    unreadAlerts,
    totalInvoices,
    flightsIn48h,
    recentPassenger,
    recentReminder,
    settings,
    lastUpdated: new Date().toISOString()
  };
};
