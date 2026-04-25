import api from './api';

// Use sessionStorage so each tab has its own independent session
const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('session_alive');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  getToken: () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }
};

export default authService;
