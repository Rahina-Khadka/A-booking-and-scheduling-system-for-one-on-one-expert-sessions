import api from './api';

const reviewService = {
  createReview: async (data) => { const r = await api.post('/reviews', data); return r.data; },
  getExpertReviews: async (expertId) => { const r = await api.get(`/reviews/expert/${expertId}`); return r.data; },
  canReview: async (bookingId) => { const r = await api.get(`/reviews/can-review/${bookingId}`); return r.data; }
};

export default reviewService;
