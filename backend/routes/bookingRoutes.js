const express = require('express');
const { 
  createBooking, 
  getBookings, 
  updateBookingStatus, 
  deleteBooking,
  rescheduleBooking,
  getAvailableSlots
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Available slots (must be before /:id routes)
router.get('/available-slots', protect, getAvailableSlots);

// Booking routes (all protected)
router.route('/')
  .post(protect, createBooking)
  .get(protect, getBookings);

router.route('/:id')
  .put(protect, updateBookingStatus)
  .delete(protect, deleteBooking);

router.put('/:id/reschedule', protect, rescheduleBooking);

module.exports = router;
