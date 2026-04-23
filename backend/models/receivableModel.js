const pool = require('./db');

const getReceivables = async () => {
  const [rows] = await pool.query('SELECT * FROM receivables ORDER BY date DESC');
  return rows;
};

const addReceivable = async (receivableData) => {
  const { date, category, amount, payment_method, description, notes } = receivableData;
  const [result] = await pool.query(
    'INSERT INTO receivables (date, category, amount, payment_method, description, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [date, category, amount, payment_method, description, notes]
  );
  return result.insertId;
};

const updateReceivable = async (id, receivableData) => {
  const { date, category, amount, payment_method, description, notes } = receivableData;
  await pool.query(
    'UPDATE receivables SET date = ?, category = ?, amount = ?, payment_method = ?, description = ?, notes = ? WHERE id = ?',
    [date, category, amount, payment_method, description, notes, id]
  );
};

const deleteReceivable = async (id) => {
  await pool.query('DELETE FROM receivables WHERE id = ?', [id]);
};

module.exports = {
  getReceivables,
  addReceivable,
  updateReceivable,
  deleteReceivable
};
