const express = require('express');
const {
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
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/users', protect, adminOnly, getAllUsers);
router.get('/experts', protect, adminOnly, getAllExperts);
router.get('/experts/pending', protect, adminOnly, getPendingExperts);
router.put('/experts/:id/verify', protect, adminOnly, verifyExpert);
router.get('/bookings', protect, adminOnly, getAllBookings);
router.get('/stats', protect, adminOnly, getSystemStats);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);

// Analytics
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/analytics/export/csv', protect, adminOnly, exportCSV);

module.exports = router;
