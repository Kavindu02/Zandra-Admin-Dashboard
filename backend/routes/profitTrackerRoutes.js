const express = require('express');
const router = express.Router();
const profitTrackerController = require('../controllers/profitTrackerController');

router.get('/', profitTrackerController.getProfitTrackerData);
router.post('/recalculate', profitTrackerController.recalculateAll);
router.put('/:id', profitTrackerController.updateProfitRecord);
router.delete('/:id', profitTrackerController.deleteProfitRecord);

module.exports = router;
