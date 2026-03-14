const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const session = require('express-session');
const passport = require('./config/passport');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const Message = require('./models/Message');
const Booking = require('./models/Booking');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB(); // make sure your ./config/database.js uses process.env.MONGODB_URI

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      if (origin === process.env.CLIENT_URL) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    // In production, only allow the configured CLIENT_URL
    if (origin === process.env.CLIENT_URL) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'mySuperSecret123!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/experts', require('./routes/expertRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Expert Booking API is running' });
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'myJWTSecret123!');
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Join a session room
  socket.on('join-room', async ({ bookingId }) => {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit('error', { message: 'Booking not found' });
        return;
      }

      const isParticipant = 
        booking.userId.toString() === socket.userId ||
        booking.expertId.toString() === socket.userId;

      if (!isParticipant) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      socket.join(bookingId);
      socket.bookingId = bookingId;
      socket.to(bookingId).emit('user-joined', { userId: socket.userId });
      console.log(`User ${socket.userId} joined room ${bookingId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle chat messages
  socket.on('send-message', async ({ bookingId, message, senderName }) => {
    try {
      const newMessage = await Message.create({
        bookingId,
        senderId: socket.userId,
        senderName,
        message,
        type: 'text'
      });

      io.to(bookingId).emit('receive-message', {
        _id: newMessage._id,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ bookingId, offer }) => {
    socket.to(bookingId).emit('webrtc-offer', { offer, userId: socket.userId });
  });

  socket.on('webrtc-answer', ({ bookingId, answer }) => {
    socket.to(bookingId).emit('webrtc-answer', { answer, userId: socket.userId });
  });

  socket.on('webrtc-ice-candidate', ({ bookingId, candidate }) => {
    socket.to(bookingId).emit('webrtc-ice-candidate', { candidate, userId: socket.userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.bookingId) {
      socket.to(socket.bookingId).emit('user-left', { userId: socket.userId });
    }
    console.log('User disconnected:', socket.userId);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});