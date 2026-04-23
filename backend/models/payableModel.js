const pool = require('./db');

const getPayables = async () => {
  const [rows] = await pool.query('SELECT * FROM payables ORDER BY date DESC');
  return rows;
};

const addPayable = async (payableData) => {
  const { date, category, amount, payment_method, reason, notes } = payableData;
  const [result] = await pool.query(
    'INSERT INTO payables (date, category, amount, payment_method, reason, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [date, category, amount, payment_method, reason, notes]
  );
  return result.insertId;
};

const updatePayable = async (id, payableData) => {
  const { date, category, amount, payment_method, reason, notes } = payableData;
  await pool.query(
    'UPDATE payables SET date = ?, category = ?, amount = ?, payment_method = ?, reason = ?, notes = ? WHERE id = ?',
    [date, category, amount, payment_method, reason, notes, id]
  );
};

const deletePayable = async (id) => {
  await pool.query('DELETE FROM payables WHERE id = ?', [id]);
};

module.exports = {
  getPayables,
  addPayable,
  updatePayable,
  deletePayable
};
