import api from './api';

const notificationService = {
  getNotifications: async () => { const r = await api.get('/notifications'); return r.data; },
  getUnreadCount: async () => { const r = await api.get('/notifications/unread-count'); return r.data; },
  markAsRead: async (id) => { const r = await api.put(`/notifications/${id}/read`); return r.data; },
  markAllAsRead: async () => { const r = await api.put('/notifications/read-all'); return r.data; },
  deleteNotification: async (id) => { const r = await api.delete(`/notifications/${id}`); return r.data; }
};

export default notificationService;
