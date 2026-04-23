const express = require('express');
const router = express.Router();
const expenseModel = require('../models/expenseModel');

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await expenseModel.getExpenses();
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST add new expense
router.post('/', async (req, res) => {
  try {
    const id = await expenseModel.addExpense(req.body);
    res.json({ id, message: 'Expense added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// PUT update existing expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await expenseModel.updateExpense(id, req.body);
    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await expenseModel.deleteExpense(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
