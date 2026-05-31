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

// TURN server credentials for WebRTC — fetched live from Metered TURN API
router.get('/turn-credentials', protect, async (req, res) => {
  try {
    const response = await fetch(
      'https://rahina.metered.live/api/v1/turn/credentials?apiKey=tDD_Mgh_5C0ib5TGxBzDyoDCOfBzZakPSkF1JYd_J1lc5wl7'
    );
    if (!response.ok) throw new Error(`Metered API error: ${response.status}`);
    const iceServers = await response.json();
    console.log('[TURN] Fetched', iceServers.length, 'ICE servers from Metered');
    res.json({ iceServers });
  } catch (err) {
    console.error('[TURN] Failed to fetch from Metered, using fallback:', err.message);
    // Fallback in case Metered API is unreachable
    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp',
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ]
    });
  }
});

module.exports = router;
