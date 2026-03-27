const Booking = require('../models/Booking');
const { getRefundPolicy, refundKhalti, refundEsewa } = require('../services/paymentService');
const NotificationService = require('../services/notificationService');

/**
 * @desc    Cancel booking and trigger refund if applicable
 * @route   POST /api/refunds/:bookingId
 * @access  Private (booking owner only)
 */
const cancelAndRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('userId', 'name email')
      .populate('expertId', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only the user who made the booking can cancel
    if (booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (['completed', 'rejected'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    // ── Determine refund eligibility ─────────────────────────────────────────
    const wasPaid = booking.payment?.status === 'paid';
    let refundResult = null;

    if (wasPaid) {
      const { policy, percent } = getRefundPolicy(booking.date, booking.startTime);
      const refundAmount = Math.round((booking.payment.amount * percent) / 100);

      if (policy === 'none') {
        // No refund — just cancel
        booking.payment.refund = {
          status: 'none',
          amount: 0,
          policy: 'none',
          reason: 'Cancelled within 1 hour of session — no refund applicable'
        };
      } else {
        // Attempt gateway refund
        try {
          if (booking.payment.gateway === 'khalti') {
            const amountPaisa = refundAmount * 100;
            const khaltiRes = await refundKhalti(booking.payment.pidx, amountPaisa);

            booking.payment.status = policy === 'full' ? 'refunded' : 'partial_refund';
            booking.payment.refund = {
              status: policy === 'full' ? 'refunded' : 'partial_refund',
              amount: refundAmount,
              refundTransactionId: khaltiRes.refund_id || khaltiRes.pidx,
              refundedAt: new Date(),
              policy,
              reason: req.body.reason || 'User cancelled booking'
            };
            refundResult = { gateway: 'khalti', status: 'processed', amount: refundAmount };

          } else if (booking.payment.gateway === 'esewa') {
            const esewaRes = await refundEsewa(booking.payment.transactionId, refundAmount);

            // eSewa is manual — mark as pending
            booking.payment.status = 'partial_refund';
            booking.payment.refund = {
              status: 'pending',
              amount: refundAmount,
              refundTransactionId: esewaRes.transactionId,
              policy,
              reason: req.body.reason || 'User cancelled booking'
            };
            refundResult = { gateway: 'esewa', status: 'pending_manual', amount: refundAmount };
          }
        } catch (refundErr) {
          console.error('Refund API error:', refundErr.response?.data || refundErr.message);
          // Don't block cancellation if refund API fails — mark as pending
          booking.payment.refund = {
            status: 'pending',
            amount: refundAmount,
            policy,
            reason: 'Refund API failed — will be processed manually'
          };
          refundResult = { gateway: booking.payment.gateway, status: 'pending_manual', amount: refundAmount };
        }
      }
    }

    // ── Cancel the booking ───────────────────────────────────────────────────
    booking.status = 'cancelled';
    await booking.save();

    // ── Notify both parties ──────────────────────────────────────────────────
    await NotificationService.notifyBookingCancelled(booking, 'user');

    if (wasPaid && booking.payment.refund?.amount > 0) {
      await NotificationService.notifyRefundStatus(booking);
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking,
      refund: wasPaid ? {
        policy: booking.payment.refund?.policy,
        amount: booking.payment.refund?.amount,
        status: booking.payment.refund?.status,
        note: booking.payment.gateway === 'esewa' && booking.payment.refund?.status === 'pending'
          ? 'eSewa refund will be processed within 3–5 business days'
          : undefined
      } : { policy: 'none', amount: 0, status: 'none' }
    });
  } catch (error) {
    console.error('Cancel & refund error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get refund status for a booking
 * @route   GET /api/refunds/:bookingId
 * @access  Private
 */
const getRefundStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .select('status payment userId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { policy, percent } = getRefundPolicy(booking.date, booking.startTime);

    res.json({
      bookingStatus: booking.status,
      paymentStatus: booking.payment?.status,
      refund: booking.payment?.refund || { status: 'none', amount: 0 },
      eligibility: {
        policy,
        refundPercent: percent,
        refundAmount: Math.round(((booking.payment?.amount || 0) * percent) / 100)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { cancelAndRefund, getRefundStatus };
