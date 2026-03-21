import api from './api';

/**
 * Review Service
 * Handles review-related API calls
 */
const reviewService = {
  /**
   * Create a review
   */
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  /**
   * Get reviews for an expert
   */
  getExpertReviews: async (expertId) => {
    const response = await api.get(`/reviews/expert/${expertId}`);
    return response.data;
  },

  /**
   * Check if user can review a booking
   */
  canReview: async (bookingId) => {
    const response = await api.get(`/reviews/can-review/${bookingId}`);
    return response.data;
  }
};

export default reviewService;
