const express = require('express');
const router = express.Router();
const controller = require('../controllers/geminiController');

router.post('/parse-ticket', controller.parseTicket);

module.exports = router;
