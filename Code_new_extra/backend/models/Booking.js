const mongoose = require('mongoose');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');

/**
 * Booking Schema
 * Stores booking information between users and experts
 */
const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide a booking date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  topic: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  rescheduleHistory: [{
    previousDate: Date,
    previousStartTime: String,
    previousEndTime: String,
    rescheduledAt: { type: Date, default: Date.now },
    rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  reminders: {
    sent24h: { type: Boolean, default: false },
    sent1h:  { type: Boolean, default: false }
  },
  payment: {
    gateway: { type: String, enum: ['khalti', 'esewa', null], default: null },
    status: { type: String, enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'partial_refund'], default: 'unpaid' },
    amount: { type: Number, default: 0 },
    transactionId: { type: String, default: null },
    pidx: { type: String, default: null },
    refId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    refund: {
      status: { type: String, enum: ['none', 'pending', 'refunded', 'partial_refund', 'failed'], default: 'none' },
      amount: { type: Number, default: 0 },        // actual refund amount in NPR
      refundTransactionId: { type: String, default: null },
      refundedAt: { type: Date, default: null },
      reason: { type: String, default: null },
      policy: { type: String, enum: ['full', 'partial', 'none'], default: 'none' } // which policy applied
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
bookingSchema.index({ userId: 1, expertId: 1, date: 1 });
bookingSchema.index({ status: 1, date: 1, 'reminders.sent24h': 1 });
bookingSchema.index({ status: 1, date: 1, 'reminders.sent1h': 1 });

/**
 * Encrypt sensitive payment fields before saving
 */
const PAYMENT_FIELDS = ['transactionId', 'pidx', 'refId'];

bookingSchema.pre('save', function(next) {
  if (this.payment) {
    PAYMENT_FIELDS.forEach(field => {
      const val = this.payment[field];
      if (val && !isEncrypted(val)) {
        this.payment[field] = encrypt(val);
      }
    });
    if (this.payment.refund?.refundTransactionId && !isEncrypted(this.payment.refund.refundTransactionId)) {
      this.payment.refund.refundTransactionId = encrypt(this.payment.refund.refundTransactionId);
    }
  }
  next();
});

/**
 * Decrypt payment fields on a plain booking object
 */
const decryptPaymentFields = (booking) => {
  if (!booking?.payment) return booking;
  const p = booking.payment;
  PAYMENT_FIELDS.forEach(f => { if (p[f]) p[f] = decrypt(p[f]); });
  if (p.refund?.refundTransactionId) {
    p.refund.refundTransactionId = decrypt(p.refund.refundTransactionId);
  }
  return booking;
};

bookingSchema.methods.decryptPayment = function() {
  const obj = this.toObject();
  return decryptPaymentFields(obj);
};

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.decryptPaymentFields = decryptPaymentFields;
