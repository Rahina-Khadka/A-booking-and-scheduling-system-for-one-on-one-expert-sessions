const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true // Format: "09:00"
  },
  endTime: {
    type: String,
    required: true // Format: "17:00"
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  breakTimes: [{
    startTime: String,
    endTime: String,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique schedule per expert per day
scheduleSchema.index({ expert: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);