const Message = require('../models/Message');
const Booking = require('../models/Booking');

/**
 * @desc    Get messages for a booking
 * @route   GET /api/messages/:bookingId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isParticipant = 
      booking.userId.toString() === req.user._id.toString() ||
      booking.expertId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    // Get messages
    const messages = await Message.find({ bookingId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Save a message
 * @route   POST /api/messages
 * @access  Private
 */
const saveMessage = async (req, res) => {
  try {
    const { bookingId, message, type } = req.body;

    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isParticipant = 
      booking.userId.toString() === req.user._id.toString() ||
      booking.expertId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create message
    const newMessage = await Message.create({
      bookingId,
      senderId: req.user._id,
      senderName: req.user.name,
      message,
      type: type || 'text'
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  saveMessage
};
