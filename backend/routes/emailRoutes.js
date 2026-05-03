const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/send-itinerary', emailController.sendItineraryEmail);
router.post('/send-invoice', emailController.sendInvoiceEmail);

module.exports = router;
