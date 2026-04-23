const pool = require('./db');

const getEmployees = async () => {
  const [rows] = await pool.query('SELECT * FROM employees ORDER BY id DESC');
  return rows;
};

const addEmployee = async (employeeData) => {
  const { name, phone, email } = employeeData;
  const [result] = await pool.query(
    'INSERT INTO employees (name, phone, email) VALUES (?, ?, ?)',
    [name, phone, email]
  );
  return result.insertId;
};

const updateEmployee = async (id, employeeData) => {
  const { name, phone, email } = employeeData;
  await pool.query(
    'UPDATE employees SET name = ?, phone = ?, email = ? WHERE id = ?',
    [name, phone, email, id]
  );
};

const deleteEmployee = async (id) => {
  await pool.query('DELETE FROM employees WHERE id = ?', [id]);
};

module.exports = {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee
};
