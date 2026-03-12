const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Passport Google OAuth Configuration
 * Handles Google authentication for admin users
 */

// List of authorized admin emails
const authorizedAdminEmails = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : [];

// Initialize Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();

        // Check if email is in authorized admin list
        if (!authorizedAdminEmails.includes(email)) {
          return done(null, false, { 
            message: 'Unauthorized: This email is not authorized for admin access' 
          });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          // Update user role to admin if not already
          if (user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
          }
          return done(null, user);
        }

        // Create new admin user
        user = await User.create({
          name: profile.displayName,
          email: email,
          password: Math.random().toString(36).slice(-8), // Random password (won't be used)
          role: 'admin',
          profilePicture: profile.photos[0]?.value || ''
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Log configuration status
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
  console.log('⚠️  Google OAuth not configured. Admin login via Google will not work.');
  console.log('   To enable: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
} else {
  console.log('✅ Google OAuth configured successfully');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
