const Dashboard = require('../models/dashboardModel');

exports.getDashboardSummary = async (req, res) => {
  try {
    const data = await Dashboard.getDashboardSummary();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDashboardSettings = async (req, res) => {
  try {
    const payload = {
      activeEmployees: Number(req.body.activeEmployees) || 0,
      monthlyProfit: Number(req.body.monthlyProfit) || 0,
      totalProfit: Number(req.body.totalProfit) || 0
    };

    const data = await Dashboard.updateDashboardSettings(payload);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
