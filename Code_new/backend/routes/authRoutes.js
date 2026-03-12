const express = require('express');
const passport = require('passport');
const { register, login, googleCallback, getCurrentGoogleUser } = require('../controllers/authController');

const router = express.Router();

// Traditional authentication routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    session: false 
  }),
  googleCallback
);

router.get('/google/current', getCurrentGoogleUser);

module.exports = router;
