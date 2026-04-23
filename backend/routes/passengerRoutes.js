const express = require('express');
const router = express.Router();
const passengerModel = require('../models/passengerModel');

router.get('/', async (req, res) => {
  try {
    const passengers = await passengerModel.getAllPassengers();
    res.json(passengers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const passenger = await passengerModel.addPassenger(req.body);
    res.status(201).json(passenger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const passenger = await passengerModel.updatePassenger(req.params.id, req.body);
    res.json(passenger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await passengerModel.deletePassenger(req.params.id);
    res.json({ message: 'Passenger deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
