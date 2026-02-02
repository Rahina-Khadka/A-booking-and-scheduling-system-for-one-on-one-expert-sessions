const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Register page
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Validate required fields
    if (!email || !password || !role) {
      return res.render('auth/login', { error: 'Please fill in all fields' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid email, password, or role' });
    }
    
    // Check if the user's role matches the selected role
    if (user.role !== role) {
      return res.render('auth/login', { error: 'Invalid role selection for this account' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', { error: 'Invalid email, password, or role' });
    }
    
    // Create session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/dashboard/admin');
    } else if (user.role === 'expert') {
      res.redirect('/dashboard/expert');
    } else {
      res.redirect('/dashboard/user');
    }
  } catch (error) {
    console.error(error);
    res.render('auth/login', { error: 'Server error' });
  }
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, expertise, hourlyRate, bio } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', { error: 'Email already registered' });
    }
    
    // Create user data
    const userData = {
      name,
      email,
      password,
      role,
      bio
    };
    
    // Add expert-specific fields
    if (role === 'expert') {
      userData.expertise = expertise;
      userData.hourlyRate = hourlyRate;
    }
    
    // Prevent admin registration through regular form
    if (role === 'admin') {
      return res.render('auth/register', { error: 'Admin accounts cannot be created through registration. Please contact system administrator.' });
    }
    
    // Create user
    const user = new User(userData);
    await user.save();
    
    // Create session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Redirect based on role (admin cannot register through this route)
    if (user.role === 'expert') {
      res.redirect('/dashboard/expert');
    } else {
      res.redirect('/dashboard/user');
    }
  } catch (error) {
    console.error(error);
    res.render('auth/register', { error: 'Server error' });
  }
});

// Google OAuth routes (Admin only)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    // Create session for admin
    req.session.user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    };
    res.redirect('/dashboard/admin');
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
});

module.exports = router;