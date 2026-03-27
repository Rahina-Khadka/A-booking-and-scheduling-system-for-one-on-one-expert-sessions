const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { Parser } = require('json2csv');
const { generateInvoicePDF } = require('../services/invoiceService');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['user', 'expert'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all experts
 * @route   GET /api/admin/experts
 * @access  Private/Admin
 */
const getAllExperts = async (req, res) => {
  try {
    const experts = await User.find({ role: 'expert' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(experts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all bookings
 * @route   GET /api/admin/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('expertId', 'name email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalExperts = await User.countDocuments({ role: 'expert' });
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const totalReviews = await Review.countDocuments();

    // Get recent activity
    const recentBookings = await Booking.find()
      .populate('userId', 'name')
      .populate('expertId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find({ role: { $in: ['user', 'expert'] } })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalExperts,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalReviews
      },
      recentActivity: {
        bookings: recentBookings,
        users: recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get experts pending verification
 * @route   GET /api/admin/experts/pending
 * @access  Private/Admin
 */
const getPendingExperts = async (req, res) => {
  try {
    const experts = await User.find({ role: 'expert', verificationStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(experts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Approve or reject expert verification
 * @route   PUT /api/admin/experts/:id/verify
 * @access  Private/Admin
 */
const verifyExpert = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const expert = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'expert' },
      { verificationStatus: status },
      { new: true }
    ).select('-password');
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    // Send in-app notification to expert
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: expert._id,
        type: 'verification_update',
        title: status === 'approved' ? '🎉 Verification Approved' : 'Verification Rejected',
        message: status === 'approved'
          ? 'Congratulations! Your expert profile has been verified. You are now visible to users.'
          : 'Your verification was rejected. Please contact support for more information.',
        link: '/expert-dashboard'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({ message: `Expert ${status}`, expert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get analytics data with date range + category filters
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 * Query params: startDate, endDate, category, groupBy (day|week|month)
 */
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, category, groupBy = 'day' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    const bookingMatch = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    // ── Summary KPIs ─────────────────────────────────────────────────────────
    const [
      totalUsers,
      totalExperts,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalReviews
    ] = await Promise.all([
      User.countDocuments({ role: 'user', ...(dateFilter.$gte ? { createdAt: dateFilter } : {}) }),
      User.countDocuments({ role: 'expert' }),
      Booking.countDocuments(bookingMatch),
      Booking.countDocuments({ ...bookingMatch, status: 'completed' }),
      Booking.countDocuments({ ...bookingMatch, status: 'cancelled' }),
      Review.countDocuments()
    ]);

    // ── Revenue (paid bookings only) ─────────────────────────────────────────
    const revenueAgg = await Booking.aggregate([
      { $match: { ...bookingMatch, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$payment.amount' }, count: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const paidSessions = revenueAgg[0]?.count || 0;

    // ── Revenue over time ────────────────────────────────────────────────────
    const groupFormat = groupBy === 'month'
      ? { year: { $year: '$date' }, month: { $month: '$date' } }
      : groupBy === 'week'
      ? { year: { $year: '$date' }, week: { $week: '$date' } }
      : { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } };

    const revenueOverTime = await Booking.aggregate([
      { $match: { ...bookingMatch, 'payment.status': 'paid' } },
      { $group: { _id: groupFormat, revenue: { $sum: '$payment.amount' }, sessions: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // ── Booking trends (all statuses) ────────────────────────────────────────
    const bookingTrends = await Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: { ...groupFormat, status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // ── Top experts by revenue + sessions ────────────────────────────────────
    const topExpertsAgg = await Booking.aggregate([
      { $match: { ...bookingMatch, 'payment.status': 'paid' } },
      {
        $group: {
          _id: '$expertId',
          revenue: { $sum: '$payment.amount' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'expert'
        }
      },
      { $unwind: '$expert' },
      {
        $project: {
          name: '$expert.name',
          email: '$expert.email',
          expertise: '$expert.expertise',
          rating: '$expert.rating',
          revenue: 1,
          sessions: 1
        }
      }
    ]);

    // ── Booking status breakdown ─────────────────────────────────────────────
    const statusBreakdown = await Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // ── New users over time ──────────────────────────────────────────────────
    const userGrowth = await User.aggregate([
      { $match: { role: 'user', ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) } },
      { $group: { _id: groupFormat, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      summary: {
        totalUsers,
        totalExperts,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalReviews,
        totalRevenue,
        paidSessions,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
      },
      revenueOverTime,
      bookingTrends,
      topExperts: topExpertsAgg,
      statusBreakdown,
      userGrowth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Export bookings report as CSV
 * @route   GET /api/admin/analytics/export/csv
 * @access  Private/Admin
 */
const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); match.date.$lte = e; }
    }

    const bookings = await Booking.find(match)
      .populate('userId', 'name email')
      .populate('expertId', 'name email')
      .lean();

    const rows = bookings.map(b => ({
      'Booking ID': b._id,
      'User': b.userId?.name,
      'User Email': b.userId?.email,
      'Expert': b.expertId?.name,
      'Expert Email': b.expertId?.email,
      'Date': new Date(b.date).toLocaleDateString(),
      'Start Time': b.startTime,
      'End Time': b.endTime,
      'Status': b.status,
      'Topic': b.topic || '',
      'Payment Status': b.payment?.status || 'unpaid',
      'Amount (NPR)': b.payment?.amount || 0,
      'Gateway': b.payment?.gateway || '',
      'Created At': new Date(b.createdAt).toISOString()
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAllExperts,
  getAllBookings,
  getSystemStats,
  deleteUser,
  updateUserRole,
  getPendingExperts,
  verifyExpert,
  getAnalytics,
  exportCSV
};
