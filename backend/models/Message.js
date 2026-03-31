const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['text', 'system'], default: 'text' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
