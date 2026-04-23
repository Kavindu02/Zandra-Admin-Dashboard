const pool = require('./db');

const getCashFlowData = async (year) => {
  // Aggregate Cash In (Receivables + ProfitTracker Sell)
  const [receivables] = await pool.query(
    `SELECT MONTH(date) as month, SUM(amount) as total 
     FROM receivables 
     WHERE YEAR(date) = ? 
     GROUP BY MONTH(date)`,
    [year]
  );

  const [ticketSales] = await pool.query(
    `SELECT MONTH(created_at) as month, SUM(sell) as total 
     FROM ProfitTracker 
     WHERE YEAR(created_at) = ? AND isDeleted = 0
     GROUP BY MONTH(created_at)`,
    [year]
  );

  // Aggregate Cash Out (Payables + Expenses + Payroll)
  const [payables] = await pool.query(
    `SELECT MONTH(date) as month, SUM(amount) as total 
     FROM payables 
     WHERE YEAR(date) = ? 
     GROUP BY MONTH(date)`,
    [year]
  );

  const [expenses] = await pool.query(
    `SELECT MONTH(date) as month, SUM(amount) as total 
     FROM expenses 
     WHERE YEAR(date) = ? 
     GROUP BY MONTH(date)`,
    [year]
  );

  const [payroll] = await pool.query(
    `SELECT MONTH(payrollDate) as month, SUM(netSalary) as total 
     FROM payroll 
     WHERE YEAR(payrollDate) = ? 
     GROUP BY MONTH(payrollDate)`,
    [year]
  );

  // Initialize 12 months of data
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: new Date(2000, i).toLocaleString('en-US', { month: 'short' }),
    cashIn: 0,
    cashOut: 0,
    net: 0,
    runningBalance: 0
  }));

  // Populate Cash In
  receivables.forEach(r => {
    if (r.month >= 1 && r.month <= 12) {
      monthlyData[r.month - 1].cashIn += Number(r.total || 0);
    }
  });

  ticketSales.forEach(ts => {
    if (ts.month >= 1 && ts.month <= 12) {
      monthlyData[ts.month - 1].cashIn += Number(ts.total || 0);
    }
  });

  // Populate Cash Out
  payables.forEach(p => {
    if (p.month >= 1 && p.month <= 12) {
      monthlyData[p.month - 1].cashOut += Number(p.total || 0);
    }
  });
  expenses.forEach(e => {
    if (e.month >= 1 && e.month <= 12) {
      monthlyData[e.month - 1].cashOut += Number(e.total || 0);
    }
  });
  payroll.forEach(py => {
    if (py.month >= 1 && py.month <= 12) {
      monthlyData[py.month - 1].cashOut += Number(py.total || 0);
    }
  });

  // Calculate Net and Running Balance
  let currentBalance = 0;
  monthlyData.forEach(m => {
    m.net = m.cashIn - m.cashOut;
    currentBalance += m.net;
    m.runningBalance = currentBalance;
  });

  return monthlyData;
};

const getProfitLossData = async (year) => {
  // Trigger sync to ensure we have data from CustomersFlights
  const profitTrackerModel = require('./profitTrackerModel');
  await profitTrackerModel.getProfitTrackerData();

  // 1. Income & COGS (from ProfitTracker)
  const [ticketData] = await pool.query(
    `SELECT 
      MONTH(created_at) as month, 
      SUM(sell) as income, 
      SUM(cost) as cost 
     FROM ProfitTracker 
     WHERE YEAR(created_at) = ? AND isDeleted = 0
     GROUP BY MONTH(created_at)`,
    [year]
  );

  // 2. General Expenses
  const [expenses] = await pool.query(
    `SELECT MONTH(date) as month, SUM(amount) as total 
     FROM expenses 
     WHERE YEAR(date) = ? 
     GROUP BY MONTH(date)`,
    [year]
  );

  // 3. Payroll (Net Salary + Employer Contributions)
  // Correcting column names to epfEmpr and etf as per payrollModel.js
  const [payroll] = await pool.query(
    `SELECT 
      MONTH(payrollDate) as month, 
      SUM(netSalary + epfEmpr + etf) as total 
     FROM payroll 
     WHERE YEAR(payrollDate) = ? 
     GROUP BY MONTH(payrollDate)`,
    [year]
  );

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: new Date(2000, i).toLocaleString('en-US', { month: 'short' }),
    income: 0,
    cogs: 0,
    grossProfit: 0,
    generalExpenses: 0,
    payrollExpenses: 0,
    expenses: 0,
    netProfit: 0
  }));

  ticketData.forEach(td => {
    if (td.month >= 1 && td.month <= 12) {
      monthlyData[td.month - 1].income = Number(td.income || 0);
      monthlyData[td.month - 1].cogs = Number(td.cost || 0);
      monthlyData[td.month - 1].grossProfit = monthlyData[td.month - 1].income - monthlyData[td.month - 1].cogs;
    }
  });

  expenses.forEach(e => {
    if (e.month >= 1 && e.month <= 12) {
      monthlyData[e.month - 1].generalExpenses += Number(e.total || 0);
      monthlyData[e.month - 1].expenses += Number(e.total || 0);
    }
  });

  payroll.forEach(p => {
    if (p.month >= 1 && p.month <= 12) {
      monthlyData[p.month - 1].payrollExpenses += Number(p.total || 0);
      monthlyData[p.month - 1].expenses += Number(p.total || 0);
    }
  });

  monthlyData.forEach(m => {
    m.netProfit = m.grossProfit - m.expenses;
  });

  return monthlyData;
};

module.exports = {
  getCashFlowData,
  getProfitLossData
};
