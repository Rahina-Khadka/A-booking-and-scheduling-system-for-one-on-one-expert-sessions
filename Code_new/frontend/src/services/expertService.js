import api from './api';

/**
 * Expert Service
 * Handles expert-related operations
 */
const expertService = {
  /**
   * Get all experts
   */
  getExperts: async (params = {}) => {
    const response = await api.get('/experts', { params });
    return response.data;
  },

  /**
   * Get expert by ID
   */
  getExpertById: async (id) => {
    const response = await api.get(`/experts/${id}`);
    return response.data;
  },

  /**
   * Get recommended experts
   */
  getRecommendedExperts: async () => {
    const response = await api.get('/experts/recommended');
    return response.data;
  }
};

export default expertService;
