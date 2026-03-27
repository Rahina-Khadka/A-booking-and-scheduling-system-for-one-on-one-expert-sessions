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
    session: false
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth error:', err.message);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

// Get current user profile (used by GoogleAuthSuccessPage)
router.get('/google/current', protect, getCurrentGoogleUser);

module.exports = router;
