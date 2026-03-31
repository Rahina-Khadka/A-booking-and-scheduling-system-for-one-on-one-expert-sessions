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
    const { name, password, role, documents } = req.body;
    // Normalize email consistently
    const email = req.body.email?.toLowerCase().trim();

    console.log('📝 Registration request received:', { name, email, role });

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Build user data
    const userData = { name, email, password, role: role || 'user' };
    if (role === 'expert' && documents) {
      userData.documents = documents;
      userData.verificationStatus = 'pending';
    }

    const user = await User.create(userData);
    console.log('✅ User created successfully:', user._id, '| email:', user.email, '| DB:', require('mongoose').connection.name);

    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token: token
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    // Surface Mongoose validation errors clearly
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
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
    // Normalize email consistently — same as registration
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;

    console.log('🔐 Login request received:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user — email is stored lowercase by schema, but normalize input too
    const user = await User.findOne({ email }).select('+password');

    console.log('🔍 DB query for email:', email, '| DB:', require('mongoose').connection.name, '| Found:', !!user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful:', user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Google OAuth callback — handles all roles
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
    }

    const token = generateToken(req.user._id);
    // Pass role so the success page can redirect correctly
    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?token=${token}&role=${req.user.role}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

/**
 * @desc    Get current user profile (called by GoogleAuthSuccessPage with Bearer token)
 * @route   GET /api/auth/google/current
 * @access  Private
 */
const getCurrentGoogleUser = async (req, res) => {
  try {
    // req.user is set by the protect middleware
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
