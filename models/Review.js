const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: true // Since reviews are only from completed bookings
  },
  expertResponse: {
    comment: {
      type: String,
      maxlength: 500
    },
    respondedAt: {
      type: Date
    }
  },
  isHelpful: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpful: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  if (!this.isHelpful || this.isHelpful.length === 0) return 0;
  const helpful = this.isHelpful.filter(h => h.helpful).length;
  const total = this.isHelpful.length;
  return Math.round((helpful / total) * 100);
});

// Compound index to ensure unique review per user per booking
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
reviewSchema.index({ expert: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);