const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, review } = req.body;

    // Check if booking exists and is completed
    const booking = await Booking.findById(bookingId)
      .populate('expertId', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already submitted for this booking' });
    }

    // Create review
    const newReview = await Review.create({
      bookingId,
      userId: req.user._id,
      expertId: booking.expertId._id,
      rating,
      review
    });

    // Update expert's average rating
    await updateExpertRating(booking.expertId._id);

    // Notify expert
    await NotificationService.notifyNewReview(
      booking.expertId._id,
      req.user.name,
      rating
    );

    await newReview.populate('userId', 'name');
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get reviews for an expert
 * @route   GET /api/reviews/expert/:expertId
 * @access  Public
 */
const getExpertReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ expertId: req.params.expertId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Check if user can review a booking
 * @route   GET /api/reviews/can-review/:bookingId
 * @access  Private
 */
const canReview = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.json({ canReview: false, reason: 'Not authorized' });
    }

    if (booking.status !== 'completed') {
      return res.json({ canReview: false, reason: 'Session not completed' });
    }

    const existingReview = await Review.findOne({ bookingId: req.params.bookingId });
    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed' });
    }

    res.json({ canReview: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper function to update expert's average rating
 */
const updateExpertRating = async (expertId) => {
  try {
    const reviews = await Review.find({ expertId });
    
    if (reviews.length === 0) {
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(expertId, {
      rating: averageRating,
      totalRatings: reviews.length
    });
  } catch (error) {
    console.error('Error updating expert rating:', error);
  }
};

module.exports = {
  createReview,
  getExpertReviews,
  canReview
};
