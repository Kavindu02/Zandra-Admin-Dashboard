const db = require('./db');

const ensureTableExists = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS Invoices (
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
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY invoiceNo (invoiceNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

exports.getAllInvoices = async () => {
  await ensureTableExists();
  const [rows] = await db.query('SELECT * FROM Invoices ORDER BY created_at DESC');
  return rows;
};

exports.getInvoiceById = async (id) => {
  const [rows] = await db.query('SELECT * FROM Invoices WHERE id = ?', [id]);
  return rows[0];
};

exports.getNextInvoiceNo = async () => {
  await ensureTableExists();
  
  let invMax = 0;
  let profitMax = 0;

  try {
    const [invRows] = await db.query(`
      SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNo, '/', -1) AS UNSIGNED)) as maxNum 
      FROM Invoices 
      WHERE invoiceNo LIKE 'ZT/INV/%'
    `);
    invMax = invRows[0]?.maxNum || 0;
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
  
  try {
    const [profitRows] = await db.query(`
      SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNo, '/', -1) AS UNSIGNED)) as maxNum 
      FROM ProfitTracker 
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
      [checkInv] = await db.query("SELECT id FROM Invoices WHERE invoiceNo = ?", [nextNo]);
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    }

    try {
      [checkProfit] = await db.query("SELECT id FROM ProfitTracker WHERE invoiceNo = ?", [nextNo]);
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
    `INSERT INTO Invoices (
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
    await db.query('UPDATE Invoices SET status = ?, amount = ?, qty = ? WHERE id = ?', [status, amount, qty, id]);
  } else {
    await db.query('UPDATE Invoices SET status = ? WHERE id = ?', [status, id]);
  }
};

exports.deleteInvoice = async (id) => {
  const [rows] = await db.query('SELECT invoiceNo FROM Invoices WHERE id = ?', [id]);
  if (rows.length > 0) {
    const invoiceNo = rows[0].invoiceNo;
    await db.query('UPDATE ProfitTracker SET isDeleted = 1 WHERE invoiceNo = ?', [invoiceNo]);
  }
  await db.query('DELETE FROM Invoices WHERE id = ?', [id]);
};
