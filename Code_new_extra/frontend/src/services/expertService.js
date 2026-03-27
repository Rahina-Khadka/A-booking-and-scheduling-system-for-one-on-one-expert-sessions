import api from './api';

const expertService = {
  getExperts: async (params = {}) => { const r = await api.get('/experts', { params }); return r.data; },
  getExpertById: async (id) => { const r = await api.get(`/experts/${id}`); return r.data; },
  getRecommendedExperts: async () => { const r = await api.get('/experts/recommended'); return r.data; }
};

export default expertService;
