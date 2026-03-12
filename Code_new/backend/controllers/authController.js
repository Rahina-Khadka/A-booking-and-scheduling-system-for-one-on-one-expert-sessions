const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    console.log('📝 Registration request received:', { 
      name: req.body.name, 
      email: req.body.email, 
      role: req.body.role 
    });

    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    console.log('✅ Creating new user...');
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    console.log('✅ User created successfully:', user._id);

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token
      });
    } else {
      console.log('❌ Failed to create user');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    console.log('🔐 Login request received:', { email: req.body.email });

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isPasswordMatch);

    if (isPasswordMatch) {
      const token = generateToken(user._id);
      console.log('✅ Login successful:', user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token
      });
    } else {
      console.log('❌ Invalid password');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = async (req, res) => {
  try {
    // User is attached to req by passport
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
    }

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

/**
 * @desc    Get current user from Google OAuth
 * @route   GET /api/auth/google/current
 * @access  Private
 */
const getCurrentGoogleUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  googleCallback,
  getCurrentGoogleUser
};
