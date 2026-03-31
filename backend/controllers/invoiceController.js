const Booking = require('../models/Booking');
const { generateInvoicePDF, generateInvoiceBuffer } = require('../services/invoiceService');
const emailService = require('../services/emailService');

const getBooking = async (id) =>
  Booking.findById(id)
    .populate('userId', 'name email phone')
    .populate('expertId', 'name email expertise hourlyRate');

/**
 * @desc    Download invoice PDF
 * @route   GET /api/invoice/:bookingId
 * @access  Private
 */
const downloadInvoice = async (req, res) => {
  try {
    const booking = await getBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.payment?.status !== 'paid') {
      return res.status(400).json({ message: 'Invoice only available for paid bookings' });
    }

    generateInvoicePDF(booking, res);
  } catch (error) {
    console.error('Invoice download error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Email invoice to user
 * @route   POST /api/invoice/:bookingId/email
 * @access  Private
 */
const emailInvoice = async (req, res) => {
  try {
    const booking = await getBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.payment?.status !== 'paid') {
      return res.status(400).json({ message: 'Invoice only available for paid bookings' });
    }

    const pdfBuffer = await generateInvoiceBuffer(booking);
    const invoiceNo = `INV-${booking._id.toString().slice(-8).toUpperCase()}`;
    await emailService.sendInvoiceEmail(booking, pdfBuffer, invoiceNo);

    res.json({ message: `Invoice sent to ${booking.userId.email}` });
  } catch (error) {
    console.error('Invoice email error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { downloadInvoice, emailInvoice };
