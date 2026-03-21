const mongoose = require('mongoose');

/**
 * Review Schema
 * Stores user reviews and ratings for experts
 */
const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ expertId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
