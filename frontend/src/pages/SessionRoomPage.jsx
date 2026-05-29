import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useWebRTC from '../hooks/useWebRTC';
import socketService from '../services/socketService';
import messageService from '../services/messageService';
import bookingService from '../services/bookingService';

// ── Icons (inline SVG to avoid extra deps) ───────────────────────────────────
const MicOnIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21h2v-2.07A8.001 8.001 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z"/></svg>;
const MicOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-2.21-1.79-4-4-4S7 2.79 7 5v.18l7.98 7.99zm-12.2-9.95L1.27 2.73 0 4l6.25 6.25c0 .08-.02.16-.02.24 0 2.76 2.24 5 5 5 .34 0 .68-.03 1-.09l1.72 1.72c-.83.38-1.74.61-2.72.61-3.31 0-6-2.69-6-6H3a9 9 0 0 0 7.72 8.9V23h2v-2.1A9.007 9.007 0 0 0 21 12h-1.7c0 3.31-2.69 6-6 6-.34 0-.67-.03-1-.08l-1.56-1.56c.79-.44 1.44-1.09 1.88-1.88L2.78 1.22z"/></svg>;
const CamOnIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>;
const CamOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>;
const PhoneIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"/></svg>;
const SendIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const EmojiIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>;

// ── Tooltip wrapper ───────────────────────────────────────────────────────────
const Tip = ({ label, children }) => (
  <div className="relative group flex items-center justify-center">
    {children}
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
      {label}
    </span>
  </div>
);

// ── Control button ────────────────────────────────────────────────────────────
const CtrlBtn = ({ onClick, active, danger, accent, label, children }) => {
  const base = 'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-95';
  const cls = danger
    ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
    : accent
    ? 'bg-accent-600 hover:bg-accent-500 text-white focus:ring-accent-500'
    : active
    ? 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-400'
    : 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500';
  return (
    <Tip label={label}>
      <button onClick={onClick} className={`${base} ${cls}`}>{children}</button>
    </Tip>
  );
};

// ── Simple emoji set ──────────────────────────────────────────────────────────
const EMOJIS = ['😀','😂','😍','🤔','👍','👎','❤️','🔥','🎉','😢','😮','🙏','✅','❌','💡','📚','🚀','⭐','💬','🤝'];

// ── Session timer hook ────────────────────────────────────────────────────────
const useTimer = (running) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// ── Main component ────────────────────────────────────────────────────────────
const SessionRoomPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking]               = useState(null);
  const [messages, setMessages]             = useState([]);
  const [newMessage, setNewMessage]         = useState('');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [showEndDialog, setShowEndDialog]   = useState(false);
  const [showEmoji, setShowEmoji]           = useState(false);
  const [isTyping, setIsTyping]             = useState(false);   // remote is typing
  const [connState, setConnState]           = useState('new');   // WebRTC connectionState
  const [toast, setToast]                   = useState('');

  const messagesEndRef    = useRef(null);
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const listenersRef      = useRef(false);
  const typingTimerRef    = useRef(null);
  const localTypingTimer  = useRef(null);

  const { localStream, remoteStream, isAudioEnabled, isVideoEnabled, isConnected,
          initializeMedia, createOffer, toggleAudio, toggleVideo, cleanup,
          registerSignalingListeners, peerConnection } = useWebRTC(bookingId);

  const timer = useTimer(isConnected);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const addSystemMessage = useCallback((text) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.type === 'system' && last?.message === text) return prev;
      return [...prev, { _id: Date.now().toString(), message: text, type: 'system', createdAt: new Date() }];
    });
  }, []);

  // ── init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
      if (socketService.socket) {
        ['receive-message','user-joined','user-left','webrtc-offer','webrtc-answer',
         'webrtc-ice-candidate','typing-start','typing-stop'].forEach(e => socketService.socket.off(e));
      }
      socketService.disconnect();
    };
  }, [bookingId]);

  useEffect(() => { if (localVideoRef.current  && localStream)  localVideoRef.current.srcObject  = localStream;  }, [localStream]);
  useEffect(() => { 
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      setIsOtherUserOnline(true); // if we have remote stream, they're definitely online
    }
  }, [remoteStream]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // track WebRTC connection state for quality indicator
  useEffect(() => {
    if (!peerConnection?.current) return;
    const pc = peerConnection.current;
    const handler = () => setConnState(pc.connectionState);
    pc.addEventListener('connectionstatechange', handler);
    return () => pc.removeEventListener('connectionstatechange', handler);
  }, [peerConnection?.current]);

  const initializeSession = async () => {
    try {
      const bookings = await bookingService.getBookings();
      const current  = bookings.find(b => String(b._id) === String(bookingId));
      if (!current) { setError('Booking not found or you are not a participant.'); setLoading(false); return; }

      // Block learner from joining if confirmed but not yet paid
      const myUserId = String(user._id);
      const bUserId = String(current.userId?._id || current.userId || '');
      const isLearner = myUserId === bUserId;
      if (isLearner && current.status === 'confirmed' && current.payment?.status !== 'paid') {
        setError('Payment required before joining the session. Please pay first.');
        setLoading(false);
        return;
      }

      setBooking(current);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      socketService.connect(token);
      await new Promise(r => setTimeout(r, 300));

      if (!listenersRef.current) {
        listenersRef.current = true;
        socketService.socket.on('receive-message', msg =>
          setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]));
        socketService.socket.on('user-joined', () => {
          setIsOtherUserOnline(true);
          addSystemMessage('Other participant joined the session');
          showToast('Participant joined 🎉');
          // When other person joins, send a new offer
          setTimeout(() => createOffer(false), 1000);
        });
        socketService.socket.on('expert-waiting', () => {
          showToast('Your expert has joined and is waiting for you! 🎯');
          addSystemMessage('Expert has joined the session room');
        });
        socketService.socket.on('user-left', () => {
          setIsOtherUserOnline(false);
          addSystemMessage('Other participant left the session');
          showToast('Participant left the session');
        });
        socketService.socket.on('session-ended', () => {
          addSystemMessage('Session ended by the other participant');
          showToast('Session ended');
          setTimeout(() => { cleanup(); navigate('/bookings'); }, 2000);
        });
        socketService.socket.on('typing-start', () => {
          setIsTyping(true);
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsTyping(false), 5000);
        });
        socketService.socket.on('typing-stop', () => {
          setIsTyping(false);
          clearTimeout(typingTimerRef.current);
        });
        registerSignalingListeners();
      }

      socketService.joinRoom(bookingId);
      const prev = await messageService.getMessages(bookingId);
      setMessages(prev);
      await initializeMedia(true, false);

      // Determine roles: lower userId is the offerer (impolite), higher is polite
      const myId = String(user._id);
      const expertId = String(current.expertId?._id || current.expertId || '');
      const userId = String(current.userId?._id || current.userId || '');
      const otherId = myId === expertId ? userId : expertId;
      const iAmPolite = myId > otherId;

      // Create peer connection with polite flag set
      // Only the impolite side initiates the offer
      setTimeout(async () => {
        await createOffer(iAmPolite);
      }, 2000);

      setLoading(false);
    } catch {
      setError('Failed to initialize session');
      setLoading(false);
    }
  };

  // ── chat ─────────────────────────────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    socketService.sendMessage(bookingId, newMessage, user.name);
    socketService.socket?.emit('typing-stop', { room: bookingId });
    setNewMessage('');
    setShowEmoji(false);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    socketService.socket?.emit('typing-start', { room: bookingId });
    clearTimeout(localTypingTimer.current);
    localTypingTimer.current = setTimeout(() => {
      socketService.socket?.emit('typing-stop', { room: bookingId });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── connection quality ────────────────────────────────────────────────────────
  const qualityColor = { connected: 'bg-green-400', connecting: 'bg-yellow-400', new: 'bg-yellow-400', disconnected: 'bg-red-500', failed: 'bg-red-500' };
  const qualityLabel = { connected: 'Good', connecting: 'Connecting', new: 'Connecting', disconnected: 'Disconnected', failed: 'Failed' };

  // ── loading / error states ────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Joining session…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/bookings" className="text-accent-400 hover:underline text-sm">← Back to Bookings</Link>
      </div>
    </div>
  );

  const myId              = String(user._id);
  const bookingUserId     = String(booking.userId?._id || booking.userId || '');
  const otherParticipant  = myId === bookingUserId ? booking.expertId : booking.userId;
  const otherName         = otherParticipant?.name || 'Participant';
  const otherInitial      = otherName.charAt(0).toUpperCase();

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden select-none">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* ── End Session Dialog ────────────────────────────────────────────── */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <PhoneIcon />
              </div>
              <h3 className="text-white font-semibold text-lg">End Session?</h3>
              <p className="text-gray-400 text-sm mt-1">This will disconnect you from the call.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={() => { 
                socketService.socket?.emit('session-end', { bookingId });
                cleanup(); 
                navigate('/bookings'); 
              }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════════════════ VIDEO PANEL (70%) ════════════════ */}
        <div className="flex flex-col" style={{ width: '70%', minWidth: 0 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {otherInitial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Session with {otherName}</span>
                  {isConnected && (
                    <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-400 text-xs">
                    {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {booking.startTime}
                  </span>
                  {isConnected && <span className="text-accent-400 text-xs font-mono">{timer}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection quality */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${qualityColor[connState] || 'bg-gray-500'}`} />
                <span className="text-gray-400 text-xs">{qualityLabel[connState] || 'Unknown'}</span>
              </div>
              {/* Presence */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOtherUserOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className={`text-xs ${isOtherUserOnline ? 'text-green-400' : 'text-gray-400'}`}>
                  {isOtherUserOnline ? 'Online' : 'Waiting…'}
                </span>
              </div>
            </div>
          </div>

          {/* Video area */}
          <div className="flex-1 relative bg-gray-950 overflow-hidden">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              /* Waiting state */
              <div className="w-full h-full flex flex-col items-center justify-center gap-5"
                style={{ background: 'radial-gradient(ellipse at center, #1f2937 0%, #111827 70%)' }}>
                {/* Pulsing avatar */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-accent-600/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="relative w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center text-3xl font-bold text-white">
                    {otherInitial}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">{otherName}</p>
                  <p className="text-gray-400 text-sm mt-1">Waiting to join…</p>
                </div>
                {isOtherUserOnline && !isConnected && (
                  <button onClick={() => { createOffer(); addSystemMessage('Initiating call…'); }}
                    className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-full text-sm font-semibold transition-colors shadow-lg">
                    Start Session
                  </button>
                )}
              </div>
            )}

            {/* Local PiP */}
            {localStream && (
              <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-gray-600 shadow-xl bg-gray-800">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}

            {/* Connection quality badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full ${qualityColor[connState] || 'bg-gray-500'}`} />
              <span className="text-white text-xs">{qualityLabel[connState] || 'Unknown'}</span>
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 py-4 px-6 flex items-center justify-center gap-4">
            <CtrlBtn onClick={toggleAudio} active={isAudioEnabled} label={isAudioEnabled ? 'Mute mic' : 'Unmute mic'}>
              {isAudioEnabled ? <MicOnIcon /> : <MicOffIcon />}
            </CtrlBtn>
            <CtrlBtn onClick={toggleVideo} active={isVideoEnabled} label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
              {isVideoEnabled ? <CamOnIcon /> : <CamOffIcon />}
            </CtrlBtn>
            {/* End session — always red */}
            <CtrlBtn onClick={() => setShowEndDialog(true)} danger label="End session">
              <PhoneIcon />
            </CtrlBtn>
          </div>
        </div>

        {/* ════════════════ CHAT PANEL (30%) ════════════════ */}
        <div className="flex flex-col bg-gray-900 border-l border-gray-800" style={{ width: '30%', minWidth: 0 }}>

          {/* Chat header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-accent-500" />
            <span className="text-white font-semibold text-sm">Chat</span>
            <span className="ml-auto text-gray-500 text-xs">{messages.filter(m => m.type !== 'system').length} messages</span>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500 text-sm">No messages yet</p>
                <p className="text-gray-600 text-xs mt-1">Say hello!</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              if (msg.type === 'system') return (
                <div key={msg._id} className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-gray-500 text-xs italic whitespace-nowrap">{msg.message}</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>
              );
              const isMe = msg.senderId === user._id || msg.senderName === user.name;
              const prevMsg = messages[idx - 1];
              const showSender = !prevMsg || prevMsg.type === 'system' || prevMsg.senderName !== msg.senderName;
              return (
                <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${showSender ? 'mt-3' : 'mt-0.5'}`}>
                  {showSender && !isMe && (
                    <span className="text-gray-400 text-xs ml-1 mb-1">{msg.senderName}</span>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
                    ${isMe
                      ? 'bg-accent-600 text-white rounded-br-sm'
                      : 'bg-gray-700 text-gray-100 rounded-bl-sm'}`}>
                    {msg.message}
                  </div>
                  <span className="text-gray-600 text-xs mt-0.5 mx-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start mt-3">
                <div className="bg-gray-700 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-gray-500 text-xs ml-2 self-end mb-1">{otherName} is typing…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji picker */}
          {showEmoji && (
            <div className="border-t border-gray-800 p-2 grid grid-cols-10 gap-1 bg-gray-900">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setNewMessage(m => m + e)}
                  className="text-lg hover:bg-gray-700 rounded p-0.5 transition-colors">
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-gray-800 p-3">
            <div className="flex items-center gap-2 bg-gray-800 rounded-2xl px-3 py-2">
              <button onClick={() => setShowEmoji(v => !v)}
                className={`text-gray-400 hover:text-white transition-colors flex-shrink-0 ${showEmoji ? 'text-accent-400' : ''}`}>
                <EmojiIcon />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none min-w-0"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="w-8 h-8 rounded-full bg-accent-600 hover:bg-accent-500 disabled:bg-gray-700 disabled:text-gray-500 text-white flex items-center justify-center transition-all flex-shrink-0">
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRoomPage;
