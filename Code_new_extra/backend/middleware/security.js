const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Security Middleware
 *
 * 1. helmet        — sets secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
 * 2. mongoSanitize — strips $ and . from req.body/params to prevent NoSQL injection
 * 3. authLimiter   — 10 attempts per 15 min on auth routes (brute-force protection)
 * 4. apiLimiter    — 200 requests per 15 min per IP on all API routes
 */

// ── HTTP security headers ────────────────────────────────────────────────────
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from other origins
  contentSecurityPolicy: false // disabled — frontend handles its own CSP
});

// ── NoSQL injection sanitization ─────────────────────────────────────────────
const sanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized suspicious input on key "${key}" from ${req.ip}`);
  }
});

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});

// ── HTTPS redirect (production only) ─────────────────────────────────────────
const httpsRedirect = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};

// ── Remove sensitive fields from responses ────────────────────────────────────
const stripSensitiveFields = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && typeof data === 'object') {
      // Remove password from any response object
      const strip = (obj) => {
        if (Array.isArray(obj)) return obj.map(strip);
        if (obj && typeof obj === 'object') {
          const cleaned = { ...obj };
          delete cleaned.password;
          delete cleaned.__v;
          Object.keys(cleaned).forEach(k => {
            if (cleaned[k] && typeof cleaned[k] === 'object') {
              cleaned[k] = strip(cleaned[k]);
            }
          });
          return cleaned;
        }
        return obj;
      };
      return originalJson(strip(data));
    }
    return originalJson(data);
  };
  next();
};

module.exports = {
  helmetMiddleware,
  sanitizeMiddleware,
  authLimiter,
  apiLimiter,
  httpsRedirect,
  stripSensitiveFields
};
