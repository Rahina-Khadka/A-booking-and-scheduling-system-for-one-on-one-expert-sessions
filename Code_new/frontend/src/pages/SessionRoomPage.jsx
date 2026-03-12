import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useWebRTC from '../hooks/useWebRTC';
import Navbar from '../components/Navbar';
import socketService from '../services/socketService';
import messageService from '../services/messageService';
import bookingService from '../services/bookingService';

/**
 * Session Room Page Component
 * Real-time communication room with chat, audio, and video
 */
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
    cleanup
  } = useWebRTC(bookingId);

  useEffect(() => {
    initializeSession();

    return () => {
      cleanup();
      socketService.disconnect();
    };
  }, [bookingId]);

  // Update video elements when streams change
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    try {
      // Fetch booking details
      const bookings = await bookingService.getBookings();
      const currentBooking = bookings.find(b => b._id === bookingId);

      if (!currentBooking) {
        setError('Booking not found');
        setLoading(false);
        return;
      }

      // Check if user is authorized
      const isParticipant = 
        currentBooking.userId._id === user._id ||
        currentBooking.expertId._id === user._id;

      if (!isParticipant) {
        setError('You are not authorized to access this session');
        setLoading(false);
        return;
      }

      setBooking(currentBooking);

      // Connect to socket
      const token = localStorage.getItem('token');
      socketService.connect(token);

      // Join room
      socketService.joinRoom(bookingId);

      // Load previous messages
      const previousMessages = await messageService.getMessages(bookingId);
      setMessages(previousMessages);

      // Listen for new messages
      socketService.onMessage((message) => {
        setMessages(prev => [...prev, message]);
      });

      // Listen for user joined/left
      socketService.onUserJoined(() => {
        setIsOtherUserOnline(true);
        addSystemMessage('Other participant joined the session');
      });

      socketService.onUserLeft(() => {
        setIsOtherUserOnline(false);
        addSystemMessage('Other participant left the session');
      });

      // Initialize audio (video off by default)
      await initializeMedia(true, false);

      setLoading(false);
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to initialize session');
      setLoading(false);
    }
  };

  const addSystemMessage = (text) => {
    const systemMsg = {
      _id: Date.now().toString(),
      message: text,
      type: 'system',
      createdAt: new Date()
    };
    setMessages(prev => [...prev, systemMsg]);
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Loading session...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <Link to="/bookings" className="text-primary hover:underline">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const otherParticipant = user._id === booking.userId._id 
    ? booking.expertId 
    : booking.userId;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">
              Session with {otherParticipant.name}
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date(booking.date).toLocaleDateString()} • {booking.startTime}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-2 ${isOtherUserOnline ? 'text-green-400' : 'text-gray-400'}`}>
              <span className={`w-3 h-3 rounded-full ${isOtherUserOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
              {isOtherUserOnline ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={handleEndSession}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              End Session
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Remote Video */}
            <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">👤</div>
                    <p>Waiting for {otherParticipant.name} to join...</p>
                  </div>
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              {localStream && (
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Connection Status */}
              {isConnected && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  Connected
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-center gap-4">
                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                  title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                  <span className="text-white text-xl">
                    {isAudioEnabled ? '🎤' : '🔇'}
                  </span>
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                  title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
                >
                  <span className="text-white text-xl">
                    {isVideoEnabled ? '📹' : '📷'}
                  </span>
                </button>

                {!isConnected && isOtherUserOnline && (
                  <button
                    onClick={handleStartCall}
                    className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700"
                  >
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg._id}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-gray-400 text-sm italic">
                      {msg.message}
                    </div>
                  ) : (
                    <div className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs ${msg.senderId === user._id ? 'bg-primary' : 'bg-gray-700'} text-white rounded-lg p-3`}>
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

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
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
