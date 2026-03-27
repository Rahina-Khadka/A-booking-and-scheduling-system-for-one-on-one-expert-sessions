const logger = require('../config/logger');
const emailService = require('./emailService');

/**
 * Alert Service
 *
 * Centralised alerting for critical events:
 *   - Failed payments
 *   - Server errors (5xx)
 *   - Refund failures
 *   - Scheduler errors
 *
 * Alerts are always logged. In production, critical alerts also
 * send an email to ADMIN_EMAILS.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

const isProd = process.env.NODE_ENV === 'production';

/**
 * Send alert email to all admins (production only)
 */
const sendAdminEmail = async (subject, html) => {
  if (!isProd || ADMIN_EMAILS.length === 0) return;
  try {
    for (const email of ADMIN_EMAILS) {
      await emailService.sendEmail(email, subject, html);
    }
  } catch (err) {
    logger.error('Alert email failed', { error: err.message });
  }
};

/**
 * Alert: payment failure
 */
const alertPaymentFailed = async ({ bookingId, gateway, amount, userId, error }) => {
  const meta = { bookingId, gateway, amount, userId, error };
  logger.error('PAYMENT_FAILED', meta);

  await sendAdminEmail(
    `🚨 Payment Failed — ${gateway?.toUpperCase()} | ExpertBook`,
    `<h2>Payment Failure Alert</h2>
     <table>
       <tr><td><b>Booking ID</b></td><td>${bookingId}</td></tr>
       <tr><td><b>Gateway</b></td><td>${gateway}</td></tr>
       <tr><td><b>Amount</b></td><td>NPR ${amount}</td></tr>
       <tr><td><b>User ID</b></td><td>${userId}</td></tr>
       <tr><td><b>Error</b></td><td>${error}</td></tr>
       <tr><td><b>Time</b></td><td>${new Date().toISOString()}</td></tr>
     </table>`
  );
};

/**
 * Alert: refund failure
 */
const alertRefundFailed = async ({ bookingId, gateway, amount, error }) => {
  const meta = { bookingId, gateway, amount, error };
  logger.error('REFUND_FAILED', meta);

  await sendAdminEmail(
    `🚨 Refund Failed — ${gateway?.toUpperCase()} | ExpertBook`,
    `<h2>Refund Failure Alert</h2>
     <table>
       <tr><td><b>Booking ID</b></td><td>${bookingId}</td></tr>
       <tr><td><b>Gateway</b></td><td>${gateway}</td></tr>
       <tr><td><b>Amount</b></td><td>NPR ${amount}</td></tr>
       <tr><td><b>Error</b></td><td>${error}</td></tr>
       <tr><td><b>Time</b></td><td>${new Date().toISOString()}</td></tr>
     </table>`
  );
};

/**
 * Alert: unhandled server error
 */
const alertServerError = async ({ route, method, statusCode, error, userId }) => {
  const meta = { route, method, statusCode, error, userId };
  logger.error('SERVER_ERROR', meta);

  await sendAdminEmail(
    `🚨 Server Error ${statusCode} — ${method} ${route} | ExpertBook`,
    `<h2>Server Error Alert</h2>
     <table>
       <tr><td><b>Route</b></td><td>${method} ${route}</td></tr>
       <tr><td><b>Status</b></td><td>${statusCode}</td></tr>
       <tr><td><b>User</b></td><td>${userId || 'anonymous'}</td></tr>
       <tr><td><b>Error</b></td><td><pre>${error}</pre></td></tr>
       <tr><td><b>Time</b></td><td>${new Date().toISOString()}</td></tr>
     </table>`
  );
};

/**
 * Alert: scheduler error
 */
const alertSchedulerError = (jobName, error) => {
  logger.error('SCHEDULER_ERROR', { job: jobName, error: error.message, stack: error.stack });
};

module.exports = {
  alertPaymentFailed,
  alertRefundFailed,
  alertServerError,
  alertSchedulerError
};
