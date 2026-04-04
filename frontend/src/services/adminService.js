import api from './api';

const ts = () => ({ _t: Date.now() });

const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users', { params: ts() });
    return response.data;
  },

  getAllExperts: async () => {
    const response = await api.get('/admin/experts', { params: ts() });
    return response.data;
  },

  getAllBookings: async () => {
    const response = await api.get('/admin/bookings', { params: ts() });
    return response.data;
  },

  getSystemStats: async () => {
    const response = await api.get('/admin/stats', { params: ts() });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  getPendingExperts: async () => {
    const response = await api.get('/admin/experts/pending', { params: ts() });
    return response.data;
  },

  verifyExpert: async (expertId, status) => {
    const response = await api.put(`/admin/experts/${expertId}/verify`, { status });
    return response.data;
  },

  getAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics', { params: { ...params, _t: Date.now() } });
    return response.data;
  },

  getPendingScanPayments: async () => {
    const response = await api.get('/admin/payments/scan-pending', { params: ts() });
    return response.data;
  },

  verifyScanPayment: async (bookingId, action) => {
    const response = await api.put(`/admin/payments/${bookingId}/scan-verify`, { action });
    return response.data;
  },

  exportCSV: async (params = {}) => {
    const response = await api.get('/admin/analytics/export/csv', {
      params: { ...params, _t: Date.now() },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default adminService;
