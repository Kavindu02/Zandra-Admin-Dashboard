const ProfitTracker = require('../models/profitTrackerModel');

exports.getProfitTrackerData = async (req, res) => {
  try {
    const data = await ProfitTracker.getProfitTrackerData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfitRecord = async (req, res) => {
  try {
    const updated = await ProfitTracker.updateProfitRecord(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProfitRecord = async (req, res) => {
  try {
    await ProfitTracker.deleteProfitRecord(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recalculateAll = async (req, res) => {
  try {
    await ProfitTracker.recalculateAllRecords();
    const data = await ProfitTracker.getProfitTrackerData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
