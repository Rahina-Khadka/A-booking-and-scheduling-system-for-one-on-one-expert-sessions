import api from './api';

/**
 * Extract a plain string MongoDB ID from any input:
 * - plain string "abc123"
 * - Mongoose ObjectId object
 * - full booking/document object with _id or id field
 */
const toId = (input) => {
  if (!input) return '';
  // Already a plain 24-char hex string
  if (typeof input === 'string' && /^[a-f\d]{24}$/i.test(input)) return input;
  // Mongoose ObjectId or object with _id
  if (typeof input === 'object') {
    const raw = input._id ?? input.id ?? input;
    return String(raw);
  }
  return String(input);
};

const bookingService = {
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const bookingId = toId(id);
    if (!bookingId || bookingId === 'undefined') throw new Error('Invalid booking ID');
    const response = await api.put(`/bookings/${bookingId}`, { status });
    return response.data;
  },

  cancelBooking: async (id) => {
    const bookingId = toId(id);
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  },

  rescheduleBooking: async (id, { date, startTime, endTime }) => {
    const bookingId = toId(id);
    const response = await api.put(`/bookings/${bookingId}/reschedule`, { date, startTime, endTime });
    return response.data;
  },

  getAvailableSlots: async (expertId, date, excludeBookingId = null) => {
    const params = { expertId, date };
    if (excludeBookingId) params.excludeBookingId = excludeBookingId;
    const response = await api.get('/bookings/available-slots', { params });
    return response.data;
  }
};

export default bookingService;
