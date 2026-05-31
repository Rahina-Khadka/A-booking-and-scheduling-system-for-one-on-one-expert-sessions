const express = require('express');
const passport = require('passport');
const { register, login, googleCallback, getCurrentGoogleUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Traditional auth
router.post('/register', register);
router.post('/login', login);

// Google OAuth — optional ?role=admin hint stored in state
router.get('/google', (req, res, next) => {
  const state = req.query.role || 'user'; // 'admin' | 'user'
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
    session: false,
    prompt: 'select_account'
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      const clientUrl = (process.env.CLIENT_URL || '').trim().replace(/[\r\n]+/g, '');
      if (err) {
        console.error('Google OAuth error:', err.message);
        return res.redirect(`${clientUrl}/login?error=auth_failed`);
      }
      if (!user) {
        return res.redirect(`${clientUrl}/login?error=unauthorized`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

// Get current user profile (used by GoogleAuthSuccessPage)
router.get('/google/current', protect, getCurrentGoogleUser);

// TURN server credentials for WebRTC
router.get('/turn-credentials', protect, (req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Open Relay — Metered free TURN
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
          'turn:openrelay.metered.ca:80?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      // Metered relay (secondary)
      {
        urls: [
          'turn:a.relay.metered.ca:80',
          'turn:a.relay.metered.ca:80?transport=tcp',
          'turn:a.relay.metered.ca:443',
          'turn:a.relay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      // Viagenie public TURN (long-standing free server)
      {
        urls: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com',
      },
      // Additional public TURN
      {
        urls: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808',
      },
      {
        urls: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808',
      },
    ]
  });
});

module.exports = router;
