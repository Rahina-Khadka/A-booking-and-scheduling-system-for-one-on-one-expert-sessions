const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Winston Logger
 *
 * Outputs:
 *   - Console: colorized, human-readable (all levels)
 *   - logs/error-%DATE%.log: errors only, rotated daily, kept 30 days
 *   - logs/combined-%DATE%.log: all levels, rotated daily, kept 14 days
 */

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Custom console format ────────────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// ── Shared file format (JSON for easy parsing) ───────────────────────────────
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ── Transports ───────────────────────────────────────────────────────────────
const transports = [
  // Console
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    )
  }),

  // Error log — daily rotate
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    zippedArchive: true,
    format: fileFormat
  }),

  // Combined log — daily rotate
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    zippedArchive: true,
    format: fileFormat
  })
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  transports,
  // Don't crash on unhandled exceptions — log them instead
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: fileFormat
    })
  ]
});

module.exports = logger;
