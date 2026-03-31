const morgan = require('morgan');
const logger = require('../config/logger');

/**
 * Morgan HTTP request logger piped into Winston
 *
 * Format: :method :url :status :response-time ms — :remote-addr
 * Skips health-check and static asset requests to reduce noise.
 */

// Stream Morgan output into Winston
const stream = {
  write: (message) => {
    // Morgan adds a trailing newline — trim it
    logger.http(message.trim());
  }
};

const skip = (req) => {
  // Skip noisy routes in production
  if (process.env.NODE_ENV === 'production') {
    return req.url === '/' || req.url.startsWith('/favicon');
  }
  return false;
};

const requestLogger = morgan(
  ':method :url :status :res[content-length] bytes — :response-time ms [:remote-addr]',
  { stream, skip }
);

module.exports = requestLogger;
