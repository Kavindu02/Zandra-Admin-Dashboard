const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', dashboardController.getDashboardSummary);
router.put('/settings', dashboardController.updateDashboardSettings);

module.exports = router;
