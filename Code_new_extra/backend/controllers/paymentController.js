const Booking = require('../models/Booking');
const User = require('../models/User');
const { initiateKhalti, verifyKhalti, buildEsewaPayload, verifyEsewa } = require('../services/paymentService');
const { alertPaymentFailed } = require('../services/alertService');
const logger = require('../config/logger');

/**
 * @desc    Initiate Khalti payment for a booking
 * @route   POST /api/payments/khalti/initiate
 * @access  Private
 */
const initiateKhaltiPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone')
      .populate('expertId', 'name hourlyRate');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.payment?.status === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    // Calculate amount in paisa (NPR × 100)
    const amountNPR = booking.expertId.hourlyRate || 100;
    const amountPaisa = amountNPR * 100;

    const khaltiResponse = await initiateKhalti({
      amount: amountPaisa,
      bookingId: booking._id,
      customerName: booking.userId.name,
      customerEmail: booking.userId.email,
      customerPhone: booking.userId.phone
    });

    // Store pidx and mark payment as pending
    booking.payment = {
      gateway: 'khalti',
      status: 'pending',
      amount: amountNPR,
      pidx: khaltiResponse.pidx
    };
    await booking.save();

    res.json({
      paymentUrl: khaltiResponse.payment_url,
      pidx: khaltiResponse.pidx
    });
  } catch (error) {
    logger.error('Khalti initiate error', { error: error.response?.data || error.message });
    await alertPaymentFailed({ bookingId: req.body.bookingId, gateway: 'khalti', amount: null, userId: req.user._id, error: error.message });
    res.status(500).json({ message: error.response?.data?.detail || error.message });
  }
};

/**
 * @desc    Verify Khalti payment after redirect
 * @route   POST /api/payments/khalti/verify
 * @access  Private
 */
const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Server-side verification — never trust frontend
    const verification = await verifyKhalti(pidx);

    if (verification.status !== 'Completed') {
      booking.payment.status = 'failed';
      await booking.save();
      return res.status(400).json({ message: `Payment not completed. Status: ${verification.status}` });
    }

    // Mark booking as paid and confirmed
    booking.payment.status = 'paid';
    booking.payment.transactionId = verification.transaction_id;
    booking.payment.paidAt = new Date();
    booking.status = 'confirmed';
    await booking.save();

    res.json({ message: 'Payment verified successfully', booking });
  } catch (error) {
    logger.error('Khalti verify error', { error: error.response?.data || error.message });
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get eSewa payment form data
 * @route   POST /api/payments/esewa/initiate
 * @access  Private
 */
const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('expertId', 'hourlyRate');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.payment?.status === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    const amountNPR = booking.expertId.hourlyRate || 100;
    const payload = buildEsewaPayload({ amount: amountNPR, bookingId: booking._id });

    // Store transaction_uuid so we can match on callback
    booking.payment = {
      gateway: 'esewa',
      status: 'pending',
      amount: amountNPR,
      transactionId: payload.transaction_uuid
    };
    await booking.save();

    res.json(payload);
  } catch (error) {
    console.error('eSewa initiate error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Verify eSewa payment after redirect
 * @route   POST /api/payments/esewa/verify
 * @access  Private
 */
const verifyEsewaPayment = async (req, res) => {
  try {
    const { encodedData, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Server-side signature verification
    const decoded = await verifyEsewa(encodedData);

    booking.payment.status = 'paid';
    booking.payment.refId = decoded.transaction_code;
    booking.payment.paidAt = new Date();
    booking.status = 'confirmed';
    await booking.save();

    res.json({ message: 'eSewa payment verified successfully', booking });
  } catch (error) {
    console.error('eSewa verify error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Get payment status for a booking
 * @route   GET /api/payments/status/:bookingId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).select('payment status userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(booking.payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateEsewaPayment,
  verifyEsewaPayment,
  getPaymentStatus
};
