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
   * Update user profile (supports base64 profilePicture)
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  /**
   * Convert a File object to a base64 data URL
   */
  fileToBase64: (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })
};

export default userService;
