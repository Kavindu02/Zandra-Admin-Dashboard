const db = require('./db');

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateDerivedParts = ({ sell, cost, companySharePercent, employeeSharePercent }) => {
  const sellValue = toNullableNumber(sell);
  const costValue = toNullableNumber(cost);
  const companyPercent = toNullableNumber(companySharePercent);
  const employeePercent = toNullableNumber(employeeSharePercent);

  if (sellValue === null || costValue === null) {
    return {
      sell: sellValue,
      cost: costValue,
      gross: null,
      companySharePercent: companyPercent,
      employeeSharePercent: employeePercent,
      companyShare: null,
      employeeShare: null
    };
  }

  const gross = Math.max(0, sellValue - costValue);
  const companyShare = companyPercent === null ? null : Math.round((gross * companyPercent) / 100);
  const employeeShare = employeePercent === null ? null : Math.round((gross * employeePercent) / 100);

  return {
    sell: sellValue,
    cost: costValue,
    gross,
    companySharePercent: companyPercent,
    employeeSharePercent: employeePercent,
    companyShare,
    employeeShare
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
      companyShare DECIMAL(15,2) NULL,
      employeeShare DECIMAL(15,2) NULL,
      status VARCHAR(80) NULL,
      handledBy VARCHAR(255) DEFAULT '',
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
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN isManual TINYINT(1) DEFAULT 0');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN isDeleted TINYINT(1) DEFAULT 0');
  await safeAlter('ALTER TABLE ProfitTracker ADD COLUMN currencies VARCHAR(120) NULL');
};

const syncFromCustomersFlights = async () => {
  await db.query(
    `INSERT INTO ProfitTracker (customerFlightId, invoiceNo, passenger, handledBy, status, isDeleted, isManual)
     SELECT cf.id, cf.invoiceNo, cf.passenger, cf.handledBy, cf.status, 0, 0
     FROM CustomersFlights cf
     WHERE NOT EXISTS (
         SELECT 1 FROM ProfitTracker pt WHERE pt.customerFlightId = cf.id
       )`
  );

  await db.query(
    `UPDATE ProfitTracker pt
     JOIN CustomersFlights cf ON pt.customerFlightId = cf.id
     SET pt.customerFlightId = cf.id,
         pt.passenger = cf.passenger,
         pt.invoiceNo = cf.invoiceNo,
       pt.handledBy = cf.handledBy,
       pt.status = cf.status
     WHERE pt.isDeleted = 0`
  );

  // Keep financial values empty for auto-synced rows until manually edited.
  await db.query(
    `UPDATE ProfitTracker
     SET paymentMethod = NULL,
         sellCurrency = NULL,
         costCurrency = NULL,
         exchangeRate = NULL,
         currencies = NULL,
         sell = NULL,
         cost = NULL,
         gross = NULL,
         companySharePercent = NULL,
         employeeSharePercent = NULL,
         companyShare = NULL,
         employeeShare = NULL
     WHERE isDeleted = 0 AND isManual = 0`
  );

  await db.query(
    `UPDATE ProfitTracker pt
     LEFT JOIN CustomersFlights cf ON pt.customerFlightId = cf.id
     SET pt.isDeleted = 1
     WHERE cf.id IS NULL`
  );
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
  await syncFromCustomersFlights();

  const [rows] = await db.query('SELECT * FROM ProfitTracker WHERE isDeleted = 0 ORDER BY id DESC');
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
  const nextHandledBy = existing.handledBy;
  const nextSellCurrency = data.sellCurrency ?? existing.sellCurrency;
  const nextCostCurrency = data.costCurrency ?? existing.costCurrency;
  const nextExchangeRate = toNullableNumber(data.exchangeRate ?? existing.exchangeRate);

  const nextCurrencies = nextSellCurrency && nextCostCurrency
    ? `${nextSellCurrency}/${nextCostCurrency} @${nextExchangeRate ?? ''}`
    : '';

  const parts = calculateDerivedParts({
    sell: data.sellAmount ?? data.sell ?? existing.sell,
    cost: data.costAmount ?? data.cost ?? existing.cost,
    companySharePercent: data.companySharePercent ?? existing.companySharePercent,
    employeeSharePercent: data.employeeSharePercent ?? existing.employeeSharePercent
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
         companySharePercent = ?,
         employeeSharePercent = ?,
         companyShare = ?,
         employeeShare = ?,
         status = ?,
         handledBy = ?,
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
      parts.companySharePercent,
      parts.employeeSharePercent,
      parts.companyShare,
      parts.employeeShare,
      nextStatus,
      nextHandledBy,
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

exports.recalculateAllRecords = async () => {
  await ensureProfitTrackerTable();
  const [rows] = await db.query(
    'SELECT id, sell, cost, companySharePercent, employeeSharePercent FROM ProfitTracker WHERE isDeleted = 0 AND isManual = 1'
  );

  for (const row of rows) {
    const parts = calculateDerivedParts({
      sell: row.sell,
      cost: row.cost,
      companySharePercent: row.companySharePercent,
      employeeSharePercent: row.employeeSharePercent
    });

    await db.query(
      `UPDATE ProfitTracker
       SET gross = ?, companyShare = ?, employeeShare = ?
       WHERE id = ?`,
      [parts.gross, parts.companyShare, parts.employeeShare, row.id]
    );
  }
};
