const db = require('./db');

const ensureTableExists = async () => {
  // Migration for Linux case-sensitivity
  try {
    const [tables] = await db.query("SHOW TABLES LIKE 'Invoices'");
    if (tables.length > 0) {
      // Also check if lowercase already exists to avoid "Table already exists" error
      const [lowerTables] = await db.query("SHOW TABLES LIKE 'invoices'");
      if (lowerTables.length === 0) {
        console.log('Renaming Invoices to invoices for Linux compatibility...');
        await db.query("RENAME TABLE Invoices TO invoices");
      }
    }
  } catch (err) {
    console.error('Migration error (renaming):', err.message);
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id int(11) NOT NULL AUTO_INCREMENT,
      invoiceNo varchar(50) NOT NULL,
      amount decimal(15,2) NOT NULL,
      qty int(11) NOT NULL,
      itemService varchar(255) DEFAULT 'Cost for the air ticket',
      status enum('Pending','Approve') DEFAULT 'Pending',
      customerFlightIds longtext NOT NULL,
      handledBy varchar(255) DEFAULT NULL,
      phone varchar(50) DEFAULT NULL,
      dateIssued date DEFAULT NULL,
      travelDate date DEFAULT NULL,
      destination varchar(255) DEFAULT NULL,
      billToName varchar(255) DEFAULT NULL,
      email_sent BOOLEAN DEFAULT FALSE,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY invoiceNo (invoiceNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure columns exist for existing tables
  const safeAlter = async (sql) => {
    try { await db.query(sql); } catch (e) {}
  };
  await safeAlter('ALTER TABLE invoices ADD COLUMN email_sent BOOLEAN DEFAULT FALSE');
};

exports.getAllInvoices = async () => {
  await ensureTableExists();
  const [rows] = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
  return rows;
};

exports.getInvoiceById = async (id) => {
  const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
  return rows[0];
};

exports.getNextInvoiceNo = async () => {
  await ensureTableExists();
  
  let invMax = 0;
  let profitMax = 0;

  try {
    const [invRows] = await db.query(`
      SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNo, '/', -1) AS UNSIGNED)) as maxNum 
      FROM invoices 
      WHERE invoiceNo LIKE 'ZT/INV/%'
    `);
    invMax = invRows[0]?.maxNum || 0;
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
  
  try {
    const [profitRows] = await db.query(`
      SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNo, '/', -1) AS UNSIGNED)) as maxNum 
      FROM profittracker 
      WHERE invoiceNo LIKE 'ZT/INV/%'
    `);
    profitMax = profitRows[0]?.maxNum || 0;
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
  

  
  let maxNum = Math.max(invMax, profitMax);
  let nextNo = '';
  let exists = true;

  while (exists) {
    maxNum++;
    const nextNumStr = maxNum.toString().padStart(5, '0');
    nextNo = `ZT/INV/${nextNumStr}`;

    let checkInv = [];
    let checkProfit = [];
    
    try {
      [checkInv] = await db.query("SELECT id FROM invoices WHERE invoiceNo = ?", [nextNo]);
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    }

    try {
      [checkProfit] = await db.query("SELECT id FROM profittracker WHERE invoiceNo = ?", [nextNo]);
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    }

    if (checkInv.length === 0 && checkProfit.length === 0) {
      exists = false;
    }
  }

  return nextNo;
};

exports.createInvoice = async (data) => {
  await ensureTableExists();
  const [result] = await db.query(
    `INSERT INTO invoices (
      invoiceNo, amount, qty, itemService, status, customerFlightIds, 
      handledBy, phone, dateIssued, travelDate, destination, billToName
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.invoiceNo,
      data.amount,
      data.qty,
      data.itemService || 'Cost for the air ticket',
      data.status || 'Pending',
      JSON.stringify(data.customerFlightIds),
      data.handledBy,
      data.phone,
      data.dateIssued,
      data.travelDate,
      data.destination,
      data.billToName
    ]
  );
  return { id: result.insertId, ...data };
};

exports.updateInvoiceStatus = async (id, status, amount, qty) => {
  if (amount !== undefined && qty !== undefined) {
    await db.query('UPDATE invoices SET status = ?, amount = ?, qty = ?, email_sent = 0 WHERE id = ?', [status, amount, qty, id]);
  } else {
    await db.query('UPDATE invoices SET status = ?, email_sent = 0 WHERE id = ?', [status, id]);
  }
};

exports.deleteInvoice = async (id) => {
  const [rows] = await db.query('SELECT invoiceNo FROM invoices WHERE id = ?', [id]);
  if (rows.length > 0) {
    const invoiceNo = rows[0].invoiceNo;
    await db.query('UPDATE profittracker SET isDeleted = 1 WHERE invoiceNo = ?', [invoiceNo]);
  }
  await db.query('DELETE FROM invoices WHERE id = ?', [id]);
};
