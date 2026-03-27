const express = require('express');
const { cancelAndRefund, getRefundStatus } = require('../controllers/refundController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Cancel booking + trigger refund
router.post('/:bookingId', protect, cancelAndRefund);

// Check refund eligibility / status
router.get('/:bookingId', protect, getRefundStatus);

module.exports = router;
