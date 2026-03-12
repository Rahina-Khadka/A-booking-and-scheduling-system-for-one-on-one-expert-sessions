const express = require('express');
const {
  getAllUsers,
  getAllExperts,
  getAllBookings,
  getSystemStats,
  deleteUser,
  updateUserRole
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

const router = express.Router();

// Admin routes (all protected and admin-only)
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/experts', protect, adminOnly, getAllExperts);
router.get('/bookings', protect, adminOnly, getAllBookings);
router.get('/stats', protect, adminOnly, getSystemStats);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
