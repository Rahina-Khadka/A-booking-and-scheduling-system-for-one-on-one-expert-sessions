import api from './api';

/**
 * User Service
 * Handles user profile operations
 */
const userService = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  }
};

export default userService;
