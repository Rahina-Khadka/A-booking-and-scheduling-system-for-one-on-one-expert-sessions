const logger = require('../config/logger');
const { alertServerError } = require('../services/alertService');

/**
 * Global error handler middleware
 * Must be registered LAST in Express (after all routes).
 *
 * Handles:
 *   - Mongoose validation errors → 400
 *   - Mongoose duplicate key     → 409
 *   - JWT errors                 → 401
 *   - Everything else            → 500 + alert
 */
const errorHandler = async (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // ── Mongoose validation error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // ── Mongoose duplicate key ────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ── Log everything ────────────────────────────────────────────────────────
  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    userId: req.user?._id,
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined
  };

  if (statusCode >= 500) {
    logger.error(message, { ...logMeta, stack: err.stack });
    // Fire alert for 5xx errors (non-blocking)
    alertServerError({
      route: req.originalUrl,
      method: req.method,
      statusCode,
      error: err.stack || message,
      userId: req.user?._id
    }).catch(() => {});
  } else {
    logger.warn(message, logMeta);
  }

  // Never leak stack traces to clients
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler — catches unmatched routes
 */
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  logger.warn('ROUTE_NOT_FOUND', { method: req.method, url: req.originalUrl, ip: req.ip });
  next(err);
};

module.exports = { errorHandler, notFound };
