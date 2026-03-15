import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useWebRTC from '../hooks/useWebRTC';
import Navbar from '../components/Navbar';
import socketService from '../services/socketService';
import messageService from '../services/messageService';
import bookingService from '../services/bookingService';

const SessionRoomPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  // Track whether socket listeners have been registered to avoid duplicates
  const listenersRegistered = useRef(false);

  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    initializeMedia,
    createOffer,
    toggleAudio,
    toggleVideo,
    cleanup,
    registerSignalingListeners,
  } = useWebRTC(bookingId);

  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
      // Remove all socket listeners before disconnecting
      if (socketService.socket) {
        socketService.socket.off('receive-message');
        socketService.socket.off('user-joined');
        socketService.socket.off('user-left');
        socketService.socket.off('webrtc-offer');
        socketService.socket.off('webrtc-answer');
        socketService.socket.off('webrtc-ice-candidate');
      }
      socketService.disconnect();
    };
  }, [bookingId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addSystemMessage = useCallback((text) => {
    setMessages(prev => {
      // Prevent duplicate system messages
      const last = prev[prev.length - 1];
      if (last?.type === 'system' && last?.message === text) return prev;
      return [...prev, {
        _id: Date.now().toString(),
        message: text,
        type: 'system',
        createdAt: new Date()
      }];
    });
  }, []);

  const initializeSession = async () => {
    try {
      const bookings = await bookingService.getBookings();
      const currentBooking = bookings.find(b => b._id === bookingId);

      if (!currentBooking) {
        setError('Booking not found');
        setLoading(false);
        return;
      }

      const isParticipant =
        currentBooking.userId._id === user._id ||
        currentBooking.expertId._id === user._id;

      if (!isParticipant) {
        setError('You are not authorized to access this session');
        setLoading(false);
        return;
      }

      setBooking(currentBooking);

      // Connect socket
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      socketService.connect(token);

      // Wait a tick for socket to establish before registering listeners
      await new Promise(r => setTimeout(r, 300));

      // Guard: only register listeners once
      if (!listenersRegistered.current) {
        listenersRegistered.current = true;

        // Chat messages — deduplicate by _id
        socketService.socket.on('receive-message', (message) => {
          setMessages(prev => {
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        });

        socketService.socket.on('user-joined', () => {
          setIsOtherUserOnline(true);
          addSystemMessage('Other participant joined the session');
        });

        socketService.socket.on('user-left', () => {
          setIsOtherUserOnline(false);
          addSystemMessage('Other participant left the session');
        });

        // Register WebRTC signaling listeners now that socket is ready
        registerSignalingListeners();
      }

      // Join room
      socketService.joinRoom(bookingId);

      // Load previous messages
      const previousMessages = await messageService.getMessages(bookingId);
      setMessages(previousMessages);

      await initializeMedia(true, false);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to initialize session');
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketService.sendMessage(bookingId, newMessage, user.name);
      setNewMessage('');
    }
  };

  const handleStartCall = () => {
    createOffer();
    addSystemMessage('Initiating call...');
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      cleanup();
      navigate('/bookings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navbar />
        <div className="text-white text-lg">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <Link to="/bookings" className="text-indigo-600 hover:underline">Back to Bookings</Link>
        </div>
      </div>
    );
  }

  const otherParticipant = user._id === booking.userId._id
    ? booking.expertId
    : booking.userId;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 pt-20 pb-4">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold text-white">Session with {otherParticipant.name}</h1>
            <p className="text-gray-400 text-xs">
              {new Date(booking.date).toLocaleDateString()} • {booking.startTime}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-sm ${isOtherUserOnline ? 'text-green-400' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isOtherUserOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              {isOtherUserOnline ? 'Online' : 'Waiting...'}
            </span>
            <button onClick={handleEndSession}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-medium">
              End Session
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">👤</div>
                    <p>Waiting for {otherParticipant.name} to join...</p>
                    {isOtherUserOnline && !isConnected && (
                      <p className="text-green-400 text-sm mt-2">
                        They're here — click "Start Call" to connect
                      </p>
                    )}
                  </div>
                </div>
              )}

              {localStream && (
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              )}

              {isConnected && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  Connected
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-center gap-4">
                <button onClick={toggleAudio}
                  className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                  title={isAudioEnabled ? 'Mute' : 'Unmute'}>
                  <span className="text-white text-xl">{isAudioEnabled ? '🎤' : '🔇'}</span>
                </button>

                <button onClick={toggleVideo}
                  className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                  title={isVideoEnabled ? 'Stop Video' : 'Start Video'}>
                  <span className="text-white text-xl">{isVideoEnabled ? '📹' : '📷'}</span>
                </button>

                {!isConnected && isOtherUserOnline && (
                  <button onClick={handleStartCall}
                    className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 font-medium">
                    Start Call
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-gray-800 rounded-lg flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg._id}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-gray-400 text-sm italic">{msg.message}</div>
                  ) : (
                    <div className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs ${msg.senderId === user._id ? 'bg-indigo-600' : 'bg-gray-700'} text-white rounded-lg p-3`}>
                        <p className="text-xs text-gray-300 mb-1">{msg.senderName}</p>
                        <p className="break-words">{msg.message}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRoomPage;
