const express = require('express');
const router = express.Router();
const payrollModel = require('../models/payrollModel');

// Add new payroll record
router.post('/', async (req, res) => {
  try {
    const id = await payrollModel.addPayroll(req.body);
    res.status(201).json({ id, message: 'Payroll record saved successfully' });
  } catch (error) {
    console.error('Error saving payroll:', error);
    res.status(500).json({ error: 'Failed to save payroll record' });
  }
});

// Get payroll records by month
router.get('/:month', async (req, res) => {
  try {
    const rows = await payrollModel.getPayrollsByMonth(req.params.month);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

// Update payroll record
router.put('/:id', async (req, res) => {
  try {
    await payrollModel.updatePayroll(req.params.id, req.body);
    res.json({ message: 'Payroll record updated successfully' });
  } catch (error) {
    console.error('Error updating payroll:', error);
    res.status(500).json({ error: 'Failed to update payroll record' });
  }
});

// Delete payroll record
router.delete('/:id', async (req, res) => {
  try {
    await payrollModel.deletePayroll(req.params.id);
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    res.status(500).json({ error: 'Failed to delete payroll record' });
  }
});

module.exports = router;
