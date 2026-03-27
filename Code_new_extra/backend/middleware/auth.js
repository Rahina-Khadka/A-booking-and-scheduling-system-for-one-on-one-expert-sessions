const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies JWT and attaches user to request
 * Security hardening:
 *   - Rejects expired tokens
 *   - Rejects tokens for non-existent users
 *   - Never exposes password in req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify signature and expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user — exclude password always
      req.user = await User.findById(decoded.id).select('-password -__v');

      if (!req.user) {
        return res.status(401).json({ message: 'User account no longer exists' });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token. Please log in again.' });
      }
      return res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Role-based access control middleware factory
 * Usage: authorize('admin'), authorize('admin', 'expert')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(' or ')}`
    });
  }
  next();
};

// Convenience aliases
const adminOnly  = authorize('admin');
const expertOnly = authorize('expert');

module.exports = { protect, authorize, adminOnly, expertOnly };
