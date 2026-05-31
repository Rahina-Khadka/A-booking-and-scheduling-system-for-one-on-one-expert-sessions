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

// TURN server credentials for WebRTC — Metered TURN (rahina.metered.live)
router.get('/turn-credentials', protect, (req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.relay.metered.ca:80' },
      {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'b29613b5747101f9ecf1de1e',
        credential: 'GNE3dP1FyYM+bse4',
      },
      {
        urls: 'turn:global.relay.metered.ca:80?transport=tcp',
        username: 'b29613b5747101f9ecf1de1e',
        credential: 'GNE3dP1FyYM+bse4',
      },
      {
        urls: 'turn:global.relay.metered.ca:443',
        username: 'b29613b5747101f9ecf1de1e',
        credential: 'GNE3dP1FyYM+bse4',
      },
      {
        urls: 'turns:global.relay.metered.ca:443?transport=tcp',
        username: 'b29613b5747101f9ecf1de1e',
        credential: 'GNE3dP1FyYM+bse4',
      },
    ]
  });
});

module.exports = router;
