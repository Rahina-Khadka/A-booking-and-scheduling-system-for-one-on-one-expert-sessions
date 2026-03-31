const express = require('express');
const { downloadInvoice, emailInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:bookingId', protect, downloadInvoice);
router.post('/:bookingId/email', protect, emailInvoice);

module.exports = router;
