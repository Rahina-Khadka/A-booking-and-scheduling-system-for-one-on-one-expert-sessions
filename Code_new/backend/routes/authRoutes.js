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
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) return res.redirect(`${process.env.CLIENT_URL}/admin/login?error=auth_failed`);
      if (!user) return res.redirect(`${process.env.CLIENT_URL}/admin/login?error=unauthorized`);
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

router.get('/google/current', getCurrentGoogleUser);

module.exports = router;
