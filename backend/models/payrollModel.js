const pool = require('./db');

const addPayroll = async (payrollData) => {
  const {
    employeeId, employeeName, payrollMonth, payrollDate,
    paymentMethod, basicSalary, allowances, overtime,
    bonuses, manualDeductions, taxDeduction, gross,
    epfEmp, epfEmpr, etf, totalDeductions,
    netSalary, paymentStatus, notes
  } = payrollData;

  const [result] = await pool.query(
    `INSERT INTO payroll (
      employeeId, employeeName, payrollMonth, payrollDate,
      paymentMethod, basicSalary, allowances, overtime,
      bonuses, manualDeductions, taxDeduction, gross,
      epfEmp, epfEmpr, etf, totalDeductions,
      netSalary, paymentStatus, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employeeId, employeeName, payrollMonth, payrollDate,
      paymentMethod, basicSalary, allowances, overtime,
      bonuses, manualDeductions, taxDeduction, gross,
      epfEmp, epfEmpr, etf, totalDeductions,
      netSalary, paymentStatus, notes
    ]
  );
  return result.insertId;
};

const getPayrollsByMonth = async (month) => {
  const [rows] = await pool.query(
    'SELECT * FROM payroll WHERE payrollMonth = ? ORDER BY id DESC',
    [month]
  );
  return rows;
};

const updatePayroll = async (id, payrollData) => {
  const {
    employeeId, employeeName, payrollMonth, payrollDate,
    paymentMethod, basicSalary, allowances, overtime,
    bonuses, manualDeductions, taxDeduction, gross,
    epfEmp, epfEmpr, etf, totalDeductions,
    netSalary, paymentStatus, notes
  } = payrollData;

  await pool.query(
    `UPDATE payroll SET 
      employeeId = ?, employeeName = ?, payrollMonth = ?, payrollDate = ?,
      paymentMethod = ?, basicSalary = ?, allowances = ?, overtime = ?,
      bonuses = ?, manualDeductions = ?, taxDeduction = ?, gross = ?,
      epfEmp = ?, epfEmpr = ?, etf = ?, totalDeductions = ?,
      netSalary = ?, paymentStatus = ?, notes = ?
    WHERE id = ?`,
    [
      employeeId, employeeName, payrollMonth, payrollDate,
      paymentMethod, basicSalary, allowances, overtime,
      bonuses, manualDeductions, taxDeduction, gross,
      epfEmp, epfEmpr, etf, totalDeductions,
      netSalary, paymentStatus, notes, id
    ]
  );
};

const deletePayroll = async (id) => {
  await pool.query('DELETE FROM payroll WHERE id = ?', [id]);
};

module.exports = {
  addPayroll,
  getPayrollsByMonth,
  updatePayroll,
  deletePayroll
};
