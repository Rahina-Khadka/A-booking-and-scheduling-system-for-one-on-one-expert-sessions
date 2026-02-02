const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    default: 0 // Platform commission (e.g., 10%)
  },
  netAmount: {
    type: Number,
    required: true // Amount after commission
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'processing'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    default: 'bank_transfer'
  },
  transactionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate net amount before saving
earningSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('commission')) {
    this.netAmount = this.amount - (this.amount * this.commission / 100);
  }
  next();
});

module.exports = mongoose.model('Earning', earningSchema);