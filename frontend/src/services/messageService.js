import api from './api';

/**
 * Message Service
 * Handles message-related API calls
 */
const messageService = {
  /**
   * Get messages for a booking
   */
  getMessages: async (bookingId) => {
    const response = await api.get(`/messages/${bookingId}`);
    return response.data;
  },

  /**
   * Save a message
   */
  saveMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  }
};

export default messageService;
