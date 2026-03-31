const Message = require('../models/Message');
const Booking = require('../models/Booking');

const getMessages = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const isParticipant = booking.userId.toString() === req.user._id.toString() || booking.expertId.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });
    const messages = await Message.find({ bookingId: req.params.bookingId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getMessages };
