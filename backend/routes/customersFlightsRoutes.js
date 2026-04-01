const express = require('express');
const router = express.Router();
const customersFlightsController = require('../controllers/customersFlightsController');

router.get('/', customersFlightsController.getCustomersFlights);
router.post('/', customersFlightsController.addCustomerFlight);
router.put('/:id', customersFlightsController.updateCustomerFlight);
router.delete('/:id', customersFlightsController.deleteCustomerFlight);

module.exports = router;
