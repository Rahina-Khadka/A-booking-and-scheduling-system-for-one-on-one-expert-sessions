const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

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

module.exports = {
  getAllUsers,
  getAllExperts,
  getAllBookings,
  getSystemStats,
  deleteUser,
  updateUserRole,
  getPendingExperts,
  verifyExpert
};
