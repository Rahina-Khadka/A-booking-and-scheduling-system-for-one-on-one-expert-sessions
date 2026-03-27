import api from './api';

/**
 * Booking Service
 * Handles booking operations
 */
const bookingService = {
  /**
   * Create new booking
   */
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  /**
   * Get user bookings
   */
  getBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (id, status) => {
    const response = await api.put(`/bookings/${id}`, { status });
    return response.data;
  },

  /**
   * Cancel booking
   */
  cancelBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Reschedule booking
   */
  rescheduleBooking: async (id, { date, startTime, endTime }) => {
    const response = await api.put(`/bookings/${id}/reschedule`, { date, startTime, endTime });
    return response.data;
  },

  /**
   * Get available slots for an expert on a date
   */
  getAvailableSlots: async (expertId, date, excludeBookingId = null) => {
    const params = { expertId, date };
    if (excludeBookingId) params.excludeBookingId = excludeBookingId;
    const response = await api.get('/bookings/available-slots', { params });
    return response.data;
  }
};

export default bookingService;
