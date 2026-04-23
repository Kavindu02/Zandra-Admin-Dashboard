const express = require('express');
const router = express.Router();
const payableModel = require('../models/payableModel');

// GET all payables
router.get('/', async (req, res) => {
  try {
    const payables = await payableModel.getPayables();
    res.json(payables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payables' });
  }
});

// POST add new payable
router.post('/', async (req, res) => {
  try {
    const id = await payableModel.addPayable(req.body);
    res.json({ id, message: 'Payable added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add payable' });
  }
});

// PUT update existing payable
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await payableModel.updatePayable(id, req.body);
    res.json({ message: 'Payable updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payable' });
  }
});

// DELETE payable
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await payableModel.deletePayable(id);
    res.json({ message: 'Payable deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete payable' });
  }
});

module.exports = router;
