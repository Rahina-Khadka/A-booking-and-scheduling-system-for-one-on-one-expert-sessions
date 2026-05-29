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
    const Notification = require('../models/Notification');
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    if (!scanImage) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    const booking = await Booking.findById(bookingId).populate('expertId', 'name');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['pending', 'confirmed', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Payment is only allowed for confirmed or completed sessions' });
    }

    // Store scan proof and mark payment as pending verification
    booking.payment.status = 'pending';
    booking.payment.gateway = 'scan';
    booking.payment.scanProof = scanImage;
    booking.payment.amount = amount || 0;
    await booking.save();

    // Notify the EXPERT (not admin) that payment proof was submitted
    try {
      await Notification.create({
        userId: booking.expertId._id,
        type: 'payment_proof',
        title: '💳 Payment Proof Received',
        message: `${req.user.name} has submitted payment proof of NPR ${amount}. Please verify in your dashboard.`,
        link: '/expert-dashboard'
      });
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr.message);
    }

    res.json({ message: 'Payment proof submitted. Awaiting expert verification.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Expert: get pending scan payments for their bookings
router.get('/scan-pending/expert', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({
      expertId: req.user._id,
      'payment.gateway': 'scan',
      'payment.status': 'pending'
    })
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(bookings.map(b => ({ ...b, _id: b._id.toString() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Expert: approve or reject scan payment
router.put('/scan-verify/expert/:bookingId', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    const Booking = require('../models/Booking');
    const Notification = require('../models/Notification');

    const booking = await Booking.findOne({ _id: req.params.bookingId, expertId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.payment?.gateway !== 'scan') {
      return res.status(400).json({ message: 'Not a scan payment' });
    }

    if (action === 'approve') {
      booking.payment.status = 'paid';
      booking.payment.paidAt = new Date();
    } else {
      booking.payment.status = 'failed';
    }
    await booking.save();

    // Notify learner
    try {
      await Notification.create({
        userId: booking.userId,
        type: 'payment_update',
        title: action === 'approve' ? '💰 Payment Confirmed' : '❌ Payment Rejected',
        message: action === 'approve'
          ? 'Your payment has been verified by the expert.'
          : 'Your payment proof was rejected by the expert. Please try again.',
        link: '/bookings'
      });
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr.message);
    }

    res.json({ message: `Payment ${action === 'approve' ? 'approved' : 'rejected'}`, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
