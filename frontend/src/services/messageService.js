import api from './api';

const messageService = {
  getMessages: async (bookingId) => { const r = await api.get(`/messages/${bookingId}`); return r.data; },
  saveMessage: async (data) => { const r = await api.post('/messages', data); return r.data; }
};

export default messageService;
