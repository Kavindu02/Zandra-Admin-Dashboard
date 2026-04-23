const express = require('express');
const router = express.Router();
const accountingModel = require('../models/accountingModel');

// Get Cash Flow data for a specific year
router.get('/cashflow', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const data = await accountingModel.getCashFlowData(year);
    
    // Calculate overall summary
    const summary = data.reduce((acc, curr) => {
      acc.totalCashIn += curr.cashIn;
      acc.totalCashOut += curr.cashOut;
      return acc;
    }, { totalCashIn: 0, totalCashOut: 0 });
    
    summary.netCashFlow = summary.totalCashIn - summary.totalCashOut;

    res.json({
      summary,
      monthlyData: data
    });
  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow data' });
  }
});

// Get Profit & Loss data for a specific year
router.get('/profit-loss', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const data = await accountingModel.getProfitLossData(year);
    
    const summary = data.reduce((acc, curr) => {
      acc.totalIncome += curr.income;
      acc.totalCogs += curr.cogs;
      acc.totalGeneralExpenses += curr.generalExpenses;
      acc.totalPayrollExpenses += curr.payrollExpenses;
      acc.totalExpenses += curr.expenses;
      return acc;
    }, { totalIncome: 0, totalCogs: 0, totalGeneralExpenses: 0, totalPayrollExpenses: 0, totalExpenses: 0 });
    
    summary.totalGrossProfit = summary.totalIncome - summary.totalCogs;
    summary.totalNetProfit = summary.totalGrossProfit - summary.totalExpenses;

    res.json({
      summary,
      monthlyData: data
    });
  } catch (error) {
    console.error('Error fetching profit & loss data:', error);
    res.status(500).json({ error: 'Failed to fetch profit & loss data' });
  }
});

module.exports = router;
