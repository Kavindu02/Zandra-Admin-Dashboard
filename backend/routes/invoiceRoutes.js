const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.get('/', invoiceController.getInvoices);
router.get('/next-no', invoiceController.getInvoiceNo);
router.post('/generate', invoiceController.generateInvoice);
router.put('/:id/status', invoiceController.updateStatus);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
