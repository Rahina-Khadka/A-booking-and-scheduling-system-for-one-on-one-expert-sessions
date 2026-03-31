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

// Scan / QR proof upload
router.post('/scan-proof', protect, async (req, res) => {
  try {
    const { bookingId, scanImage, amount } = req.body;
    const Booking = require('../models/Booking');
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    if (!scanImage) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Store scan proof and mark payment as pending verification
    booking.payment = {
      ...booking.payment,
      status: 'pending',
      gateway: 'scan',
      scanProof: scanImage,
      amount: amount || booking.expertId?.hourlyRate || 0,
    };
    await booking.save();

    res.json({ message: 'Payment proof submitted. Awaiting admin verification.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
