const express = require('express');
const router = express.Router();
const settingsModel = require('../models/settingsModel');

// Get payroll rates
router.get('/payroll', async (req, res) => {
  try {
    const settings = await settingsModel.getPayrollSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching payroll settings:', error);
    res.status(500).json({ error: 'Failed to fetch payroll settings' });
  }
});

// Update payroll rates
router.put('/payroll', async (req, res) => {
  try {
    const { epfEmployee, epfEmployer, etfEmployer } = req.body;
    if (epfEmployee === undefined || epfEmployer === undefined || etfEmployer === undefined) {
      return res.status(400).json({ error: 'Missing required rates' });
    }
    await settingsModel.updatePayrollSettings({ epfEmployee, epfEmployer, etfEmployer });
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating payroll settings:', error);
    res.status(500).json({ error: 'Failed to update payroll settings' });
  }
});

module.exports = router;
