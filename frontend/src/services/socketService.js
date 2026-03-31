import { io } from 'socket.io-client';

class SocketService {
  constructor() { this.socket = null; }

  connect(token) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverUrl = apiUrl.replace(/\/api$/, '');
    this.socket = io(serverUrl, { auth: { token } });
    return this.socket;
  }

  disconnect() { if (this.socket) { this.socket.disconnect(); this.socket = null; } }
  joinRoom(bookingId) { this.socket?.emit('join-room', { bookingId }); }
  sendMessage(bookingId, message, senderName) { this.socket?.emit('send-message', { bookingId, message, senderName }); }
  onExpertWaiting(cb) { this.socket?.on('expert-waiting', cb); }
  offExpertWaiting() { this.socket?.off('expert-waiting'); }
  sendOffer(bookingId, offer) { this.socket?.emit('webrtc-offer', { bookingId, offer }); }
  sendAnswer(bookingId, answer) { this.socket?.emit('webrtc-answer', { bookingId, answer }); }
  sendIceCandidate(bookingId, candidate) { this.socket?.emit('webrtc-ice-candidate', { bookingId, candidate }); }
}

export default new SocketService();
