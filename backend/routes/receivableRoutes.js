const express = require('express');
const router = express.Router();
const receivableModel = require('../models/receivableModel');

// GET all receivables
router.get('/', async (req, res) => {
  try {
    const receivables = await receivableModel.getReceivables();
    res.json(receivables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch receivables' });
  }
});

// POST add new receivable
router.post('/', async (req, res) => {
  try {
    const id = await receivableModel.addReceivable(req.body);
    res.json({ id, message: 'Receivable added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add receivable' });
  }
});

// PUT update existing receivable
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await receivableModel.updateReceivable(id, req.body);
    res.json({ message: 'Receivable updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update receivable' });
  }
});

// DELETE receivable
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await receivableModel.deleteReceivable(id);
    res.json({ message: 'Receivable deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete receivable' });
  }
});

module.exports = router;
