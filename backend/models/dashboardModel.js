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

  // Sync ProfitTracker to make sure data is up to date (we can trigger this via a simple DB insert/update directly or just rely on what is there) 
  // Let's grab the totals for the current year
  const currentYear = new Date().getFullYear();

  // 1. Total Income & Expenses
  const totalsRow = await safeRow(`
    SELECT 
      SUM(sell) as totalIncome,
      SUM(cost) as totalExpenses,
      COUNT(id) as totalBookings
    FROM ProfitTracker WHERE isDeleted = 0 AND YEAR(created_at) = ?
  `, [currentYear]);

  // 2. Monthly Stats for Charts
  const [monthlyRows] = await db.query(`
    SELECT 
      MONTH(created_at) as monthIndex,
      SUM(sell) as income,
      SUM(cost) as expenses,
      SUM(gross) as profit,
      COUNT(id) as bookings
    FROM ProfitTracker
    WHERE isDeleted = 0 AND YEAR(created_at) = ?
    GROUP BY MONTH(created_at)
  `, [currentYear]);

  // Transform to array of 12 months
  const monthlyStats = Array.from({ length: 12 }, (_, i) => {
    const monthData = monthlyRows.find(row => row.monthIndex === i + 1);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      name: monthNames[i],
      income: Number(monthData?.income || 0),
      expenses: Number(monthData?.expenses || 0),
      profit: Number(monthData?.profit || 0),
      bookings: Number(monthData?.bookings || 0)
    };
  });

  // 3. Top Destinations
  const [destRows] = await db.query(`
    SELECT \`to\` as destination, COUNT(*) as count 
    FROM CustomersFlights 
    WHERE \`to\` IS NOT NULL AND \`to\` != '' AND YEAR(created_at) = ?
    GROUP BY \`to\` 
    ORDER BY count DESC 
    LIMIT 5
  `, [currentYear]).catch(() => {
    // fallback if created_at is missing on CustomersFlights
    return db.query(`
      SELECT \`to\` as destination, COUNT(*) as count 
      FROM CustomersFlights 
      WHERE \`to\` IS NOT NULL AND \`to\` != '' 
      GROUP BY \`to\` 
      ORDER BY count DESC 
      LIMIT 5
    `);
  });

  const topDestinations = (destRows || []).map(r => ({
    name: r.destination,
    value: Number(r.count)
  }));

  return {
    totalCustomers: totalCustomers || 0,
    todaysFlights: todaysFlights || 0,
    pendingReminders: pendingReminders || 0,
    unreadAlerts: unreadAlerts || 0,
    totalInvoices: totalInvoices || 0,
    flightsIn48h: flightsIn48h || 0,
    totalBookings: Number(totalsRow?.totalBookings || 0),
    totalIncome: Number(totalsRow?.totalIncome || 0),
    totalExpenses: Number(totalsRow?.totalExpenses || 0),
    monthlyStats,
    topDestinations,
    recentPassenger,
    recentReminder,
    settings,
    lastUpdated: new Date().toISOString()
  };
};
