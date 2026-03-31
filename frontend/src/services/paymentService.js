import api from './api';

const paymentService = {
  initiateKhalti: async (bookingId) => {
    const response = await api.post('/payments/khalti/initiate', { bookingId });
    return response.data; // { paymentUrl, pidx }
  },

  verifyKhalti: async (pidx, bookingId) => {
    const response = await api.post('/payments/khalti/verify', { pidx, bookingId });
    return response.data;
  },

  initiateEsewa: async (bookingId) => {
    const response = await api.post('/payments/esewa/initiate', { bookingId });
    return response.data; // form payload to POST to eSewa
  },

  verifyEsewa: async (encodedData, bookingId) => {
    const response = await api.post('/payments/esewa/verify', { encodedData, bookingId });
    return response.data;
  },

  getStatus: async (bookingId) => {
    const response = await api.get(`/payments/status/${bookingId}`);
    return response.data;
  }
};

export default paymentService;
