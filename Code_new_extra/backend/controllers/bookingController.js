const Booking = require('../models/Booking');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { resetReminders } = require('../services/reminderScheduler');

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
  try {
    const { expertId, date, startTime, endTime, topic, notes } = req.body;

    // Check if expert exists
    const expert = await User.findOne({ _id: expertId, role: 'expert' });
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      expertId,
      date,
      startTime,
      endTime,
      topic,
      notes,
      status: 'pending'
    });

    // Populate user and expert details
    await booking.populate('userId', 'name email');
    await booking.populate('expertId', 'name email expertise');

    // Notify expert about new booking request
    await NotificationService.notifyNewBookingRequest(booking);

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user bookings
 * @route   GET /api/bookings
 * @access  Private
 */
const getBookings = async (req, res) => {
  try {
    let query = {};

    // If user is an expert, show bookings where they are the expert
    // Otherwise, show bookings where they are the user
    if (req.user.role === 'expert') {
      query.expertId = req.user._id;
    } else {
      query.userId = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('expertId', 'name email expertise')
      .sort({ date: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    // Users can cancel their own bookings
    // Experts can confirm/reject bookings where they are the expert
    const isUser = booking.userId.toString() === req.user._id.toString();
    const isExpert = booking.expertId.toString() === req.user._id.toString();

    if (!isUser && !isExpert) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update status
    booking.status = status;
    const updatedBooking = await booking.save();

    await updatedBooking.populate('userId', 'name email');
    await updatedBooking.populate('expertId', 'name email expertise');

    // Send notifications based on status
    if (status === 'confirmed') {
      await NotificationService.notifyBookingConfirmed(updatedBooking);
    } else if (status === 'rejected') {
      await NotificationService.notifyBookingRejected(updatedBooking);
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete/Cancel booking
 * @route   DELETE /api/bookings/:id
 * @access  Private
 */
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await booking.populate('userId', 'name email');
    await booking.populate('expertId', 'name email');

    // Notify expert about cancellation
    await NotificationService.notifyBookingCancelled(booking, 'user');

    await booking.deleteOne();
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Reschedule a booking
 * @route   PUT /api/bookings/:id/reschedule
 * @access  Private (user only)
 */
const rescheduleBooking = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'date, startTime, and endTime are required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the user who made the booking can reschedule
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only pending or confirmed bookings can be rescheduled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Only pending or confirmed bookings can be rescheduled' });
    }

    // Enforce 2-hour reschedule window restriction
    const sessionDateTime = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    const twoHoursBefore = new Date(sessionDateTime.getTime() - 2 * 60 * 60 * 1000);

    if (new Date() >= twoHoursBefore) {
      return res.status(400).json({
        message: 'Cannot reschedule within 2 hours of the session start time'
      });
    }

    // Check that the new slot is not already booked by another booking with the same expert
    const newDate = new Date(date);
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      expertId: booking.expertId,
      date: newDate,
      startTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    // Save reschedule history
    booking.rescheduleHistory.push({
      previousDate: booking.date,
      previousStartTime: booking.startTime,
      previousEndTime: booking.endTime,
      rescheduledBy: req.user._id
    });

    // Update booking with new time
    booking.date = newDate;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.status = 'pending'; // reset to pending after reschedule

    const updatedBooking = await booking.save();
    await updatedBooking.populate('userId', 'name email');
    await updatedBooking.populate('expertId', 'name email expertise');

    // Notify both parties
    await NotificationService.notifyBookingRescheduled(updatedBooking, req.user.name);

    // Reset reminder flags so new reminders fire at the new time
    await resetReminders(updatedBooking._id);

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get available slots for an expert on a given date (excluding already booked)
 * @route   GET /api/bookings/available-slots?expertId=&date=
 * @access  Private
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { expertId, date, excludeBookingId } = req.query;

    if (!expertId || !date) {
      return res.status(400).json({ message: 'expertId and date are required' });
    }

    const expert = await User.findOne({ _id: expertId, role: 'expert' });
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    // Get day of week from date
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[new Date(date).getDay()];

    // Find expert's availability for that day
    const dayAvailability = expert.availability?.find(a => a.day === dayOfWeek);
    const allSlots = dayAvailability?.slots || [];

    // Get already booked slots for that date
    const bookedQuery = {
      expertId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    };
    if (excludeBookingId) {
      bookedQuery._id = { $ne: excludeBookingId };
    }

    const bookedBookings = await Booking.find(bookedQuery).select('startTime endTime');
    const bookedTimes = new Set(bookedBookings.map(b => b.startTime));

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot.startTime));

    res.json({ day: dayOfWeek, slots: availableSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  rescheduleBooking,
  getAvailableSlots
};
