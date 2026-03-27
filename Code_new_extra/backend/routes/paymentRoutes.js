const express = require('express');
const {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateEsewaPayment,
  verifyEsewaPayment,
  getPaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/khalti/initiate', protect, initiateKhaltiPayment);
router.post('/khalti/verify', protect, verifyKhaltiPayment);

router.post('/esewa/initiate', protect, initiateEsewaPayment);
router.post('/esewa/verify', protect, verifyEsewaPayment);

router.get('/status/:bookingId', protect, getPaymentStatus);

module.exports = router;
