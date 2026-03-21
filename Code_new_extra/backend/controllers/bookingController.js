const Booking = require('../models/Booking');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

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

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking
};
