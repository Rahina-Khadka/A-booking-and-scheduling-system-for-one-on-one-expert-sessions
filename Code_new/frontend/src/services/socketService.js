import { io } from 'socket.io-client';

/**
 * Socket Service
 * Manages WebSocket connection for real-time communication
 */
class SocketService {
  constructor() {
    this.socket = null;
  }

  /**
   * Connect to socket server
   */
  connect(token) {
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a session room
   */
  joinRoom(bookingId) {
    if (this.socket) {
      this.socket.emit('join-room', { bookingId });
    }
  }

  /**
   * Send a chat message
   */
  sendMessage(bookingId, message, senderName) {
    if (this.socket) {
      this.socket.emit('send-message', { bookingId, message, senderName });
    }
  }

  /**
   * Listen for incoming messages
   */
  onMessage(callback) {
    if (this.socket) {
      this.socket.on('receive-message', callback);
    }
  }

  /**
   * Listen for user joined event
   */
  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  /**
   * Listen for user left event
   */
  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  /**
   * WebRTC signaling methods
   */
  sendOffer(bookingId, offer) {
    if (this.socket) {
      this.socket.emit('webrtc-offer', { bookingId, offer });
    }
  }

  sendAnswer(bookingId, answer) {
    if (this.socket) {
      this.socket.emit('webrtc-answer', { bookingId, answer });
    }
  }

  sendIceCandidate(bookingId, candidate) {
    if (this.socket) {
      this.socket.emit('webrtc-ice-candidate', { bookingId, candidate });
    }
  }

  onOffer(callback) {
    if (this.socket) {
      this.socket.on('webrtc-offer', callback);
    }
  }

  onAnswer(callback) {
    if (this.socket) {
      this.socket.on('webrtc-answer', callback);
    }
  }

  onIceCandidate(callback) {
    if (this.socket) {
      this.socket.on('webrtc-ice-candidate', callback);
    }
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
