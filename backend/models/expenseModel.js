const pool = require('./db');

const getExpenses = async () => {
  const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
  return rows;
};

const addExpense = async (expenseData) => {
  const { date, category, amount, payment_method, description, notes } = expenseData;
  const [result] = await pool.query(
    'INSERT INTO expenses (date, category, amount, payment_method, description, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [date, category, amount, payment_method, description, notes]
  );
  return result.insertId;
};

const updateExpense = async (id, expenseData) => {
  const { date, category, amount, payment_method, description, notes } = expenseData;
  await pool.query(
    'UPDATE expenses SET date = ?, category = ?, amount = ?, payment_method = ?, description = ?, notes = ? WHERE id = ?',
    [date, category, amount, payment_method, description, notes, id]
  );
};

const deleteExpense = async (id) => {
  await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense
};
