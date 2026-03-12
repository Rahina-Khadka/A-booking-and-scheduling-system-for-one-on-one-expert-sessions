import api from './api';

/**
 * Admin Service
 * Handles admin-related API calls
 */
const adminService = {
  /**
   * Get all users
   */
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  /**
   * Get all experts
   */
  getAllExperts: async () => {
    const response = await api.get('/admin/experts');
    return response.data;
  },

  /**
   * Get all bookings
   */
  getAllBookings: async () => {
    const response = await api.get('/admin/bookings');
    return response.data;
  },

  /**
   * Get system statistics
   */
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Delete user
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update user role
   */
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }
};

export default adminService;
