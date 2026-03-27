const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

const createReview = async (req, res) => {
  try {
    const { bookingId, rating, review } = req.body;
    const booking = await Booking.findById(bookingId).populate('expertId', 'name');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed sessions' });

    const existing = await Review.findOne({ bookingId });
    if (existing) return res.status(400).json({ message: 'Already reviewed this session' });

    const newReview = await Review.create({ bookingId, userId: req.user._id, expertId: booking.expertId._id, rating, review });

    // Update expert rating
    const reviews = await Review.find({ expertId: booking.expertId._id });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(booking.expertId._id, { rating: Math.round(avgRating * 10) / 10, totalRatings: reviews.length });

    await NotificationService.notifyNewReview(booking.expertId._id, req.user.name, rating);
    res.status(201).json(newReview);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getExpertReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ expertId: req.params.expertId }).populate('userId', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createReview, getExpertReviews };
