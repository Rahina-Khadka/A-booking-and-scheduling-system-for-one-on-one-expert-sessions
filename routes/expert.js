const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Earning = require('../models/Earning');
const Review = require('../models/Review');
const router = express.Router();

// Middleware to check authentication and expert role
const requireExpert = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'expert') {
    return res.redirect('/dashboard/' + req.session.user.role);
  }
  next();
};

// Schedule Management Page
router.get('/schedule', requireExpert, async (req, res) => {
  try {
    const schedules = await Schedule.find({ expert: req.session.user.id }).sort({ dayOfWeek: 1 });
    
    // Create a map for easy access
    const scheduleMap = {};
    schedules.forEach(schedule => {
      scheduleMap[schedule.dayOfWeek] = schedule;
    });
    
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    res.render('expert/schedule', { 
      schedules: scheduleMap, 
      daysOfWeek,
      user: req.session.user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading schedule' });
  }
});

// Update Schedule
router.post('/schedule', requireExpert, async (req, res) => {
  try {
    const { scheduleData } = req.body;
    
    // Delete existing schedules for this expert
    await Schedule.deleteMany({ expert: req.session.user.id });
    
    // Create new schedules
    const schedules = [];
    for (const [day, data] of Object.entries(scheduleData)) {
      if (data.isAvailable === 'true' && data.startTime && data.endTime) {
        schedules.push({
          expert: req.session.user.id,
          dayOfWeek: day,
          startTime: data.startTime,
          endTime: data.endTime,
          isAvailable: true
        });
      }
    }
    
    if (schedules.length > 0) {
      await Schedule.insertMany(schedules);
    }
    
    res.redirect('/expert/schedule?success=Schedule updated successfully');
  } catch (error) {
    console.error(error);
    res.redirect('/expert/schedule?error=Error updating schedule');
  }
});

// Earnings Page
router.get('/earnings', requireExpert, async (req, res) => {
  try {
    const { period = 'all', year = new Date().getFullYear() } = req.query;
    
    // Build date filter
    let dateFilter = {};
    const currentDate = new Date();
    
    switch (period) {
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: weekStart } };
        break;
      case 'month':
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        dateFilter = { createdAt: { $gte: monthStart } };
        break;
      case 'year':
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);
        dateFilter = { createdAt: { $gte: yearStart, $lte: yearEnd } };
        break;
    }
    
    // Get earnings data
    const earnings = await Earning.find({ 
      expert: req.session.user.id,
      ...dateFilter
    })
    .populate('booking', 'sessionDate topic duration user')
    .populate({
      path: 'booking',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .sort({ createdAt: -1 });
    
    // Calculate statistics
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const totalCommission = earnings.reduce((sum, earning) => sum + (earning.amount * earning.commission / 100), 0);
    const netEarnings = earnings.reduce((sum, earning) => sum + earning.netAmount, 0);
    const paidEarnings = earnings.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.netAmount, 0);
    const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.netAmount, 0);
    
    // Get completed sessions count
    const completedSessions = await Booking.countDocuments({
      expert: req.session.user.id,
      status: 'completed',
      ...dateFilter
    });
    
    // Monthly earnings for chart (last 12 months)
    const monthlyEarnings = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
      
      const monthEarnings = await Earning.aggregate([
        {
          $match: {
            expert: new mongoose.Types.ObjectId(req.session.user.id),
            createdAt: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netAmount' }
          }
        }
      ]);
      
      monthlyEarnings.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthEarnings[0]?.total || 0
      });
    }
    
    res.render('expert/earnings', {
      earnings,
      stats: {
        totalEarnings,
        totalCommission,
        netEarnings,
        paidEarnings,
        pendingEarnings,
        completedSessions
      },
      monthlyEarnings,
      period,
      year: parseInt(year),
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading earnings' });
  }
});

// Requests Management (Enhanced booking management)
router.get('/requests', requireExpert, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let statusFilter = {};
    if (status !== 'all') {
      statusFilter.status = status;
    }
    
    const bookings = await Booking.find({ 
      expert: req.session.user.id,
      ...statusFilter
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
    
    // Get statistics
    const stats = {
      pending: await Booking.countDocuments({ expert: req.session.user.id, status: 'pending' }),
      confirmed: await Booking.countDocuments({ expert: req.session.user.id, status: 'confirmed' }),
      completed: await Booking.countDocuments({ expert: req.session.user.id, status: 'completed' }),
      cancelled: await Booking.countDocuments({ expert: req.session.user.id, status: 'cancelled' })
    };
    
    res.render('expert/requests', {
      bookings,
      stats,
      currentStatus: status,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading requests' });
  }
});

// Update booking status with earnings creation
router.post('/update-booking/:bookingId', requireExpert, async (req, res) => {
  try {
    const { status, notes, meetingLink } = req.body;
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking || booking.expert.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const oldStatus = booking.status;
    booking.status = status;
    if (notes) booking.notes = notes;
    if (meetingLink) booking.meetingLink = meetingLink;
    
    await booking.save();
    
    // Create earning record when session is completed
    if (status === 'completed' && oldStatus !== 'completed') {
      const existingEarning = await Earning.findOne({ booking: booking._id });
      
      if (!existingEarning) {
        const earning = new Earning({
          expert: req.session.user.id,
          booking: booking._id,
          amount: booking.totalAmount,
          commission: 10 // 10% platform commission
        });
        await earning.save();
      }
    }
    
    res.json({ success: true, message: 'Booking updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating booking' });
  }
});

// Reviews Management Page
router.get('/reviews', requireExpert, async (req, res) => {
  try {
    const reviews = await Review.find({ expert: req.session.user.id })
      .populate('user', 'name')
      .populate('booking', 'topic sessionDate')
      .sort({ createdAt: -1 });
    
    // Calculate statistics
    const stats = await Review.aggregate([
      { $match: { expert: new mongoose.Types.ObjectId(req.session.user.id) } },
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
          },
          responseCount: {
            $sum: { $cond: [{ $ne: ['$expertResponse.comment', null] }, 1, 0] }
          }
        }
      }
    ]);
    
    const reviewStats = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      averageCommunication: 0,
      averageExpertise: 0,
      averagePunctuality: 0,
      averageHelpfulness: 0,
      recommendationCount: 0,
      responseCount: 0
    };
    
    res.render('expert/reviews', {
      reviews,
      stats: reviewStats,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error loading reviews' });
  }
});

module.exports = router;