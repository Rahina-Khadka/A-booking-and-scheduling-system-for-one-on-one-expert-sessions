const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables FIRST before any other imports that need them
dotenv.config({ path: path.join(__dirname, '.env') });

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

logger.info('🚀 Starting ExpertBook API server...');
logger.info(`🗄️  DB: ${process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@')}`);
logger.info(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT SET'}`);

const cors = require('cors');
const http = require('http');
const session = require('express-session');
const passport = require('./config/passport');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const Message = require('./models/Message');
const Booking = require('./models/Booking');
const {
  helmetMiddleware,
  sanitizeMiddleware,
  authLimiter,
  apiLimiter,
  httpsRedirect,
  stripSensitiveFields
} = require('./middleware/security');

// Connect to MongoDB
connectDB();

// Start reminder scheduler after DB connects
const { startReminderScheduler } = require('./services/reminderScheduler');
setTimeout(startReminderScheduler, 3000); // slight delay to ensure DB is ready

// Initialize express app
const app = express();
const server = http.createServer(app);

// Shared CORS origin checker
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  // Allow any Vercel preview/production deployment for this project
  if (process.env.VERCEL_PROJECT && origin.includes(process.env.VERCEL_PROJECT)) return true;
  return false;
};

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      isAllowedOrigin(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(httpsRedirect);
app.use(helmetMiddleware);
app.use(cors({
  origin: (origin, callback) => {
    isAllowedOrigin(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(sanitizeMiddleware);
app.use(stripSensitiveFields);
app.use(requestLogger);
app.use('/api', apiLimiter);

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
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/experts', require('./routes/expertRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/invoice', require('./routes/invoiceRoutes'));
app.use('/api/refunds', require('./routes/refundRoutes'));
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
  logger.debug(`Socket connected: ${socket.userId}`);

  // Join personal notification room so user can receive cross-room events
  socket.join(`user_${socket.userId}`);

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
      logger.debug(`User ${socket.userId} joined room ${bookingId}`);

      const isExpert = booking.expertId.toString() === socket.userId;
      if (isExpert) {
        const userPersonalRoom = `user_${booking.userId.toString()}`;
        io.to(userPersonalRoom).emit('expert-waiting', {
          bookingId,
          expertName: socket.userName || 'Your expert',
        });
      }
    } catch (error) {
      logger.error('Socket join-room error', { error: error.message, bookingId });
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
      logger.error('Socket send-message error', { error: error.message });
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
    logger.debug(`Socket disconnected: ${socket.userId}`);
  });
});

// 404 + global error handler (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});