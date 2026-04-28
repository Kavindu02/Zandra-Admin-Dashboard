const db = require('./db');

exports.getAllInvoices = async () => {
  const [rows] = await db.query('SELECT * FROM Invoices ORDER BY created_at DESC');
  return rows;
};

exports.getInvoiceById = async (id) => {
  const [rows] = await db.query('SELECT * FROM Invoices WHERE id = ?', [id]);
  return rows[0];
};

exports.getNextInvoiceNo = async () => {
  // Find the max number across both tables using SQL's MAX and string manipulation
  const [invRows] = await db.query(`
    SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNo, '/', -1) AS UNSIGNED)) as maxNum 
    FROM Invoices 
    WHERE invoiceNo LIKE 'ZT/INV/%'
  `);
  
  const [profitRows] = await db.query(`
    SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNo, '/', -1) AS UNSIGNED)) as maxNum 
    FROM ProfitTracker 
    WHERE invoiceNo LIKE 'ZT/INV/%'
  `);
  
  const invMax = invRows[0]?.maxNum || 0;
  const profitMax = profitRows[0]?.maxNum || 0;
  
  let maxNum = Math.max(invMax, profitMax);
  let nextNo = '';
  let exists = true;

  while (exists) {
    maxNum++;
    const nextNumStr = maxNum.toString().padStart(5, '0');
    nextNo = `ZT/INV/${nextNumStr}`;

    const [checkInv] = await db.query("SELECT id FROM Invoices WHERE invoiceNo = ?", [nextNo]);
    const [checkProfit] = await db.query("SELECT id FROM ProfitTracker WHERE invoiceNo = ?", [nextNo]);

    if (checkInv.length === 0 && checkProfit.length === 0) {
      exists = false;
    }
  }

  return nextNo;
};

exports.createInvoice = async (data) => {
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
