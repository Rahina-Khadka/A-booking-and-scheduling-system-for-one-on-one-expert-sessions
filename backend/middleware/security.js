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
    console.warn(`WARNING: Sanitized suspicious input on key "${key}" from ${req.ip}`);
  }
});

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for tests and Google OAuth redirects
    if (process.env.NODE_ENV === 'test') return true;
    if (req.path.startsWith('/google')) return true;
    return false;
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
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
      const strip = (obj) => {
        if (Array.isArray(obj)) return obj.map(strip);
        // Only process plain objects — skip strings, numbers, dates, buffers
        if (obj && typeof obj === 'object' && !(obj instanceof Date) && !Buffer.isBuffer(obj)) {
          // Convert Mongoose documents to plain objects first
          const plain = (typeof obj.toObject === 'function') ? obj.toObject() : { ...obj };
          delete plain.password;
          delete plain.__v;
          Object.keys(plain).forEach(k => {
            const val = plain[k];
            // Only recurse into plain objects and arrays — not strings (base64), numbers, booleans
            if (val && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val)) {
              plain[k] = strip(val);
            }
          });
          return plain;
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
