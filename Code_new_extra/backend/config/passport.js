const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Passport Google OAuth Configuration
 * Supports all roles: user, expert, admin
 * Role assignment:
 *   - Emails in ADMIN_EMAILS → admin
 *   - Everyone else → user (experts upgrade via admin panel)
 */

const rawEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
const adminEmails = rawEmails
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

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
        const email = profile.emails[0].value.toLowerCase().trim();
        const googleId = profile.id;
        const name = profile.displayName;
        const profilePicture = profile.photos?.[0]?.value || '';

        // Determine role
        const role = adminEmails.includes(email) ? 'admin' : 'user';

        // Find existing user by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
          // Sync googleId and picture if missing
          let changed = false;
          if (!user.googleId) { user.googleId = googleId; changed = true; }
          if (!user.profilePicture && profilePicture) { user.profilePicture = profilePicture; changed = true; }
          // Promote to admin if email is in admin list
          if (role === 'admin' && user.role !== 'admin') { user.role = 'admin'; changed = true; }
          if (changed) await user.save();
          return done(null, user);
        }

        // Create new user — no password needed for OAuth accounts
        user = await User.create({
          name,
          email,
          googleId,
          password: require('crypto').randomBytes(20).toString('hex'), // never used
          role,
          profilePicture
        });

        console.log(`✅ Google OAuth: new ${role} created — ${email}`);
        return done(null, user);
      } catch (error) {
        console.error('❌ Google OAuth error:', error.message);
        return done(error, null);
      }
    }
  )
);

if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
  console.log('⚠️  Google OAuth not configured.');
} else {
  console.log('✅ Google OAuth configured — admin emails:', adminEmails);
}

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
