import api from './api';

const userService = {
  getProfile: async () => { const r = await api.get('/users/profile'); return r.data; },
  updateProfile: async (data) => { const r = await api.put('/users/profile', data); return r.data; },
  fileToBase64: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })
};

export default userService;
