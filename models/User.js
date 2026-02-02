const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'expert', 'admin'],
    required: true
  },
  expertise: {
    type: String,
    required: function() {
      return this.role === 'expert';
    }
  },
  hourlyRate: {
    type: Number,
    required: function() {
      return this.role === 'expert';
    }
  },
  bio: {
    type: String,
    maxlength: 500
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    years: {
      type: Number,
      min: 0
    },
    description: {
      type: String,
      maxlength: 1000
    },
    certifications: [{
      name: {
        type: String,
        required: true
      },
      issuer: {
        type: String,
        required: true
      },
      dateObtained: {
        type: Date
      }
    }]
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      bookingUpdates: {
        type: Boolean,
        default: true
      },
      reviews: {
        type: Boolean,
        default: true
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  // Calculated fields for ratings (will be updated via aggregation)
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);