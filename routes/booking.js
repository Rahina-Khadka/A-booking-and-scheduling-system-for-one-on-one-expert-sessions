const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Browse experts page
router.get('/experts', requireAuth, async (req, res) => {
  try {
    const { search, expertise } = req.query;
    let query = { role: 'expert' };
    
    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (expertise) {
      query.expertise = { $regex: expertise, $options: 'i' };
    }
    
    const experts = await User.find(query).select('-password');
    const expertiseList = await User.distinct('expertise', { role: 'expert' });
    
    // Get rating information for each expert
    const expertsWithRatings = await Promise.all(
      experts.map(async (expert) => {
        const reviewStats = await Review.aggregate([
          { $match: { expert: expert._id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ]);
        
        const stats = reviewStats[0] || { averageRating: 0, totalReviews: 0 };
        
        return {
          ...expert.toObject(),
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews
        };
      })
    );
    
    res.render('booking/experts', { 
      experts: expertsWithRatings, 
      expertiseList, 
      search: search || '', 
      selectedExpertise: expertise || '',
      user: req.session.user 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading experts' });
  }
});

// Expert profile page
router.get('/expert/:id', requireAuth, async (req, res) => {
  try {
    const expert = await User.findById(req.params.id).select('-password');
    if (!expert || expert.role !== 'expert') {
      return res.status(404).render('error', { message: 'Expert not found' });
    }
    
    // Get reviews for this expert
    const reviews = await Review.find({ expert: expert._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Calculate average ratings
    const reviewStats = await Review.aggregate([
      { $match: { expert: expert._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          averageCommunication: { $avg: '$categories.communication' },
          averageExpertise: { $avg: '$categories.expertise' },
          averagePunctuality: { $avg: '$categories.punctuality' },
          averageHelpfulness: { $avg: '$categories.helpfulness' },
          recommendationCount: {
            $sum: { $cond: ['$wouldRecommend', 1, 0] }
          }
        }
      }
    ]);
    
    const stats = reviewStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      averageCommunication: 0,
      averageExpertise: 0,
      averagePunctuality: 0,
      averageHelpfulness: 0,
      recommendationCount: 0
    };
    
    res.render('booking/expert-profile', { 
      expert, 
      reviews, 
      stats, 
      user: req.session.user 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading expert profile' });
  }
});

// Book session page
router.get('/book/:expertId', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'user') {
      return res.redirect('/dashboard/' + req.session.user.role);
    }
    
    const expert = await User.findById(req.params.expertId).select('-password');
    if (!expert || expert.role !== 'expert') {
      return res.status(404).render('error', { message: 'Expert not found' });
    }
    
    res.render('booking/book-session', { expert, user: req.session.user, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading booking page' });
  }
});

// Process booking
router.post('/book/:expertId', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'user') {
      return res.redirect('/dashboard/' + req.session.user.role);
    }
    
    const { sessionDate, sessionTime, duration, topic, description } = req.body;
    
    // Validate required fields
    if (!sessionDate || !sessionTime || !duration || !topic) {
      const expert = await User.findById(req.params.expertId).select('-password');
      return res.render('booking/book-session', { 
        expert, 
        user: req.session.user, 
        error: 'Please fill in all required fields' 
      });
    }
    
    const expert = await User.findById(req.params.expertId);
    if (!expert || expert.role !== 'expert') {
      return res.status(404).render('error', { message: 'Expert not found' });
    }
    
    // Calculate total amount
    const totalAmount = (expert.hourlyRate * duration) / 60;
    
    // Create booking
    const booking = new Booking({
      user: req.session.user.id,
      expert: expert._id,
      sessionDate: new Date(sessionDate),
      sessionTime,
      duration: parseInt(duration),
      topic,
      description,
      totalAmount
    });
    
    await booking.save();
    
    res.redirect('/booking/confirmation/' + booking._id);
  } catch (error) {
    console.error(error);
    const expert = await User.findById(req.params.expertId).select('-password');
    res.render('booking/book-session', { 
      expert, 
      user: req.session.user, 
      error: 'Error creating booking. Please try again.' 
    });
  }
});

// Booking confirmation page
router.get('/confirmation/:bookingId', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('expert', 'name email expertise hourlyRate')
      .populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.user._id.toString() !== req.session.user.id) {
      return res.status(403).render('error', { message: 'Access denied' });
    }
    
    res.render('booking/confirmation', { booking, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading booking confirmation' });
  }
});

// My bookings page
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    let bookings;
    
    if (req.session.user.role === 'user') {
      bookings = await Booking.find({ user: req.session.user.id })
        .populate('expert', 'name expertise hourlyRate')
        .sort({ createdAt: -1 });
      
      // Check which bookings have reviews
      const bookingsWithReviews = await Promise.all(
        bookings.map(async (booking) => {
          const review = await Review.findOne({ booking: booking._id });
          return {
            ...booking.toObject(),
            hasReview: !!review
          };
        })
      );
      
      bookings = bookingsWithReviews;
    } else if (req.session.user.role === 'expert') {
      bookings = await Booking.find({ expert: req.session.user.id })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.render('booking/my-bookings', { bookings, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading bookings' });
  }
});

// Update booking status (for experts)
router.post('/update-status/:bookingId', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'expert') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { status, notes } = req.body;
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.expert.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    booking.status = status;
    if (notes) booking.notes = notes;
    await booking.save();
    
    res.json({ success: true, message: 'Booking status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating booking status' });
  }
});

// Review submission page
router.get('/review/:bookingId', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'user') {
      return res.redirect('/dashboard/' + req.session.user.role);
    }
    
    const booking = await Booking.findById(req.params.bookingId)
      .populate('expert', 'name expertise');
    
    if (!booking) {
      return res.status(404).render('error', { message: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.session.user.id) {
      return res.status(403).render('error', { message: 'Access denied' });
    }
    
    if (booking.status !== 'completed') {
      return res.redirect('/booking/my-bookings');
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return res.redirect('/booking/my-bookings');
    }
    
    res.render('booking/review-form', { booking, user: req.session.user, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading review page' });
  }
});

// Submit review
router.post('/review/:bookingId', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'user') {
      return res.redirect('/dashboard/' + req.session.user.role);
    }
    
    const booking = await Booking.findById(req.params.bookingId)
      .populate('expert', 'name expertise');
    
    if (!booking || booking.user.toString() !== req.session.user.id || booking.status !== 'completed') {
      return res.status(403).render('error', { message: 'Invalid booking for review' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return res.redirect('/booking/my-bookings');
    }
    
    const {
      rating,
      title,
      comment,
      communication,
      expertise,
      punctuality,
      helpfulness,
      wouldRecommend
    } = req.body;
    
    // Validate required fields
    if (!rating || !title || !comment || !communication || !expertise || !punctuality || !helpfulness) {
      return res.render('booking/review-form', {
        booking,
        user: req.session.user,
        error: 'Please fill in all required fields'
      });
    }
    
    // Create review
    const review = new Review({
      user: req.session.user.id,
      expert: booking.expert._id,
      booking: booking._id,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      categories: {
        communication: parseInt(communication),
        expertise: parseInt(expertise),
        punctuality: parseInt(punctuality),
        helpfulness: parseInt(helpfulness)
      },
      wouldRecommend: wouldRecommend === 'true'
    });
    
    await review.save();
    
    res.redirect('/booking/my-bookings?reviewed=true');
  } catch (error) {
    console.error(error);
    const booking = await Booking.findById(req.params.bookingId)
      .populate('expert', 'name expertise');
    res.render('booking/review-form', {
      booking,
      user: req.session.user,
      error: 'Error submitting review. Please try again.'
    });
  }
});

// Mark review as helpful/unhelpful
router.post('/review/:reviewId/helpful', requireAuth, async (req, res) => {
  try {
    const { helpful } = req.body;
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Remove existing vote from this user
    review.isHelpful = review.isHelpful.filter(
      vote => vote.user.toString() !== req.session.user.id
    );
    
    // Add new vote
    review.isHelpful.push({
      user: req.session.user.id,
      helpful: helpful === 'true'
    });
    
    await review.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating helpfulness' });
  }
});

// Expert response to review
router.post('/review/:reviewId/respond', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'expert') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { response } = req.body;
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.expert.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    review.expertResponse = {
      comment: response.trim(),
      respondedAt: new Date()
    };
    
    await review.save();
    
    res.json({ success: true, message: 'Response added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error adding response' });
  }
});

module.exports = router;