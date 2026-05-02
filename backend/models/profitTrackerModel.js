const db = require('./db');

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateDerivedParts = ({ sell, cost, employeeShareAmount, companySharePercent }) => {
  const sellValue = toNullableNumber(sell);
  const costValue = toNullableNumber(cost);
  const empShareAmount = toNullableNumber(employeeShareAmount) || 0;
  const coPercent = toNullableNumber(companySharePercent) || 0;

  if (sellValue === null || costValue === null) {
    return {
      sell: sellValue,
      cost: costValue,
      gross: null,
      employeeShareAmount: empShareAmount,
      companyShare: null,
      employeeShare: empShareAmount,
      companySharePercent: coPercent
    };
  }

  // 1. Sell - Cost
  const initialProfit = sellValue - costValue;
  
  // 2. Subtract Emp. Share
  const remainingAfterEmp = initialProfit - empShareAmount;
  
  // 3. Company Share calculated from remaining
  const coShareAmt = (remainingAfterEmp * coPercent) / 100;
  
  // 4. Remaining is Est. Gross Profit
  const finalProfit = remainingAfterEmp - coShareAmt;

  return {
    sell: sellValue,
    cost: costValue,
    gross: finalProfit,
    employeeShareAmount: empShareAmount,
    companyShare: coShareAmt,
    employeeShare: empShareAmount,
    companySharePercent: coPercent
  };
};

const safeAlter = async (sql) => {
  try {
    await db.query(sql);
  } catch (error) {
    const message = String(error.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('duplicate key name')) {
      throw error;
    }
  }
};

const ensureProfitTrackerTable = async () => {
  await db.query(
    `CREATE TABLE IF NOT EXISTS ProfitTracker (
      id INT PRIMARY KEY AUTO_INCREMENT,
      customerFlightId INT NULL,
      invoiceNo VARCHAR(120) NOT NULL,
      passenger VARCHAR(255) NOT NULL,
      paymentMethod VARCHAR(80) NULL,
      sellCurrency VARCHAR(30) NULL,
      costCurrency VARCHAR(30) NULL,
      exchangeRate DECIMAL(12,4) NULL,
      currencies VARCHAR(120) NULL,
      sell DECIMAL(15,2) NULL,
      cost DECIMAL(15,2) NULL,
      gross DECIMAL(15,2) NULL,
      companySharePercent DECIMAL(6,2) NULL,
      employeeSharePercent DECIMAL(6,2) NULL,
      employeeShareAmount DECIMAL(15,2) DEFAULT 0,
      companyShare DECIMAL(15,2) NULL,
      employeeShare DECIMAL(15,2) NULL,
      status VARCHAR(80) NULL,
      handledBy VARCHAR(255) DEFAULT '',
      employeeId INT NULL,
      qty INT DEFAULT 1,
      isManual TINYINT(1) DEFAULT 0,
      isDeleted TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_profit_customer (customerFlightId)
    )`
  );

  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN sellCurrency VARCHAR(30) NULL');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN costCurrency VARCHAR(30) NULL');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN exchangeRate DECIMAL(12,4) NULL');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN companySharePercent DECIMAL(6,2) NULL');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN employeeSharePercent DECIMAL(6,2) NULL');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN employeeShareAmount DECIMAL(15,2) DEFAULT 0');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN isManual TINYINT(1) DEFAULT 0');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN isDeleted TINYINT(1) DEFAULT 0');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN currencies VARCHAR(120) NULL');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN qty INT DEFAULT 1');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN employeeId INT NULL');
};

const buildSummary = (records) => {
  return records.reduce(
    (acc, record) => {
      acc.totalGrossProfit += Number(record.gross || 0);
      acc.companyShare += Number(record.companyShare || 0);
      acc.employeeShare += Number(record.employeeShare || 0);
      return acc;
    },
    {
      totalGrossProfit: 0,
      companyShare: 0,
      employeeShare: 0
    }
  );
};

exports.getProfitTrackerData = async () => {
  await ensureProfitTrackerTable();
  // syncFromCustomersFlights() call removed to avoid cluttering with non-invoiced records

  // Only show records that are manually marked (created by Invoice Generator or manually added)
  const [rows] = await db.query('SELECT * FROM ProfitTracker WHERE isDeleted = 0 AND isManual = 1 ORDER BY id DESC');
  const summary = buildSummary(rows);

  return {
    records: rows,
    summary,
    recordCount: rows.length
  };
};

exports.updateProfitRecord = async (id, data) => {
  await ensureProfitTrackerTable();

  const [rows] = await db.query('SELECT * FROM ProfitTracker WHERE id = ?', [id]);
  const existing = rows[0];
  if (!existing) {
    return null;
  }

  const nextPaymentMethod = data.paymentMethod ?? existing.paymentMethod;
  const nextStatus = existing.status;
  const nextHandledBy = data.handledBy ?? existing.handledBy;
  const nextEmployeeId = data.employeeId ?? existing.employeeId;
  const nextQty = data.qty ?? existing.qty ?? 1;
  const nextSellCurrency = data.sellCurrency ?? existing.sellCurrency;
  const nextCostCurrency = data.costCurrency ?? existing.costCurrency;
  const nextExchangeRate = toNullableNumber(data.exchangeRate ?? existing.exchangeRate);

  const nextCurrencies = nextSellCurrency && nextCostCurrency
    ? `${nextSellCurrency}/${nextCostCurrency} @${nextExchangeRate ?? ''}`
    : '';

  const parts = calculateDerivedParts({
    sell: data.sellAmount ?? data.sell ?? existing.sell,
    cost: data.costAmount ?? data.cost ?? existing.cost,
    employeeShareAmount: data.employeeShareAmount ?? existing.employeeShareAmount,
    companySharePercent: data.companySharePercent ?? existing.companySharePercent
  });

  await db.query(
    `UPDATE ProfitTracker
     SET paymentMethod = ?,
         sellCurrency = ?,
         costCurrency = ?,
         exchangeRate = ?,
         currencies = ?,
         sell = ?,
         cost = ?,
         gross = ?,
         employeeShareAmount = ?,
         companyShare = ?,
         employeeShare = ?,
         status = ?,
         handledBy = ?,
         employeeId = ?,
         qty = ?,
         companySharePercent = ?,
         isManual = 1,
         isDeleted = 0
     WHERE id = ?`,
    [
      nextPaymentMethod,
      nextSellCurrency,
      nextCostCurrency,
      nextExchangeRate,
      nextCurrencies,
      parts.sell,
      parts.cost,
      parts.gross,
      parts.employeeShareAmount,
      parts.companyShare,
      parts.employeeShare,
      nextStatus,
      nextHandledBy,
      nextEmployeeId,
      nextQty,
      parts.companySharePercent,
      id
    ]
  );

  const [updatedRows] = await db.query('SELECT * FROM ProfitTracker WHERE id = ?', [id]);
  return updatedRows[0];
};

exports.deleteProfitRecord = async (id) => {
  await ensureProfitTrackerTable();
  await db.query('UPDATE ProfitTracker SET isDeleted = 1 WHERE id = ?', [id]);
};

exports.getProfitByCustomerFlightId = async (customerFlightId) => {
  await ensureProfitTrackerTable();
  const [rows] = await db.query('SELECT * FROM ProfitTracker WHERE customerFlightId = ?', [customerFlightId]);
  return rows[0];
};

exports.getProfitByInvoiceNo = async (invoiceNo) => {
  await ensureProfitTrackerTable();
  const [rows] = await db.query('SELECT * FROM ProfitTracker WHERE invoiceNo = ? AND isDeleted = 0 ORDER BY id DESC LIMIT 1', [invoiceNo]);
  return rows[0];
};

exports.updateStatusByInvoiceNo = async (invoiceNo, status) => {
  await ensureProfitTrackerTable();
  await db.query(
    'UPDATE ProfitTracker SET status = ? WHERE invoiceNo = ? AND isDeleted = 0',
    [status, invoiceNo]
  );
};

exports.createProfitRecord = async (data) => {
  await ensureProfitTrackerTable();

  const sellCurrency = data.sellCurrency || 'LKR';
  const costCurrency = data.costCurrency || 'LKR';
  const exchangeRate = toNullableNumber(data.exchangeRate || 1);

  const currencies = `${sellCurrency}/${costCurrency} @${exchangeRate}`;

  const parts = calculateDerivedParts({
    sell: data.sellAmount || data.sell || 0,
    cost: data.costAmount || data.cost || 0,
    employeeShareAmount: data.employeeShareAmount || 0,
    companySharePercent: data.companySharePercent || 0
  });

  const [result] = await db.query(
    `INSERT INTO ProfitTracker (
      invoiceNo, passenger, paymentMethod, sellCurrency, costCurrency, 
      exchangeRate, currencies, sell, cost, gross, 
      employeeShareAmount, companyShare, employeeShare, 
      status, handledBy, employeeId, qty, isManual, companySharePercent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.invoiceNo || 'MANUAL-' + Date.now(),
      data.passenger || 'Manual Entry',
      data.paymentMethod || 'Cash',
      sellCurrency,
      costCurrency,
      exchangeRate,
      currencies,
      parts.sell,
      parts.cost,
      parts.gross,
      parts.employeeShareAmount,
      parts.companyShare,
      parts.employeeShare,
      data.status || 'Paid',
      data.handledBy || 'ZANDRA TRAVELERS',
      data.employeeId || null,
      data.qty || 1,
      data.isManual || 0,
      parts.companySharePercent
    ]
  );

  const [newRows] = await db.query('SELECT * FROM ProfitTracker WHERE id = ?', [result.insertId]);
  return newRows[0];
};

exports.recalculateAllRecords = async () => {
  await ensureProfitTrackerTable();
  const [rows] = await db.query(
    'SELECT id, sell, cost, companySharePercent, employeeSharePercent FROM ProfitTracker WHERE isDeleted = 0 AND isManual = 1'
  );

  for (const row of rows) {
    const parts = calculateDerivedParts({
      sell: row.sell,
      cost: row.cost,
      employeeShareAmount: row.employeeShareAmount,
      companySharePercent: row.companySharePercent
    });

    await db.query(
      `UPDATE ProfitTracker
       SET gross = ?, companyShare = ?, employeeShare = ?, companySharePercent = ?
       WHERE id = ?`,
      [parts.gross, parts.companyShare, parts.employeeShare, parts.companySharePercent, row.id]
    );
  }
};

exports.getEmployeeSharesTotal = async (employeeId, month) => {
  const [rows] = await db.query(
    `SELECT SUM(employeeShare) as total 
     FROM ProfitTracker 
     WHERE employeeId = ? 
     AND isDeleted = 0 
     AND DATE_FORMAT(created_at, '%Y-%m') = ?`,
    [employeeId, month]
  );
  return rows[0].total || 0;
};
