const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/send-itinerary', emailController.sendItineraryEmail);

module.exports = router;
