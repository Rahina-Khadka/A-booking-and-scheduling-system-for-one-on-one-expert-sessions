import api from './api';

const refundService = {
  /**
   * Cancel booking and trigger refund
   */
  cancelAndRefund: async (bookingId, reason = '') => {
    const response = await api.post(`/refunds/${bookingId}`, { reason });
    return response.data;
  },

  /**
   * Get refund eligibility and status for a booking
   */
  getRefundStatus: async (bookingId) => {
    const response = await api.get(`/refunds/${bookingId}`);
    return response.data;
  }
};

export default refundService;
