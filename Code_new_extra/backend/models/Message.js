const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores chat messages for session rooms
 */
const messageSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ bookingId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
