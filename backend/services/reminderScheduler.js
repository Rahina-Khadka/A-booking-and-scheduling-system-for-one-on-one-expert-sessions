  const cron = require('node-cron');
const Booking = require('../models/Booking');
const NotificationService = require('./notificationService');

/**
 * Reminder Scheduler
 *
 * Runs two cron jobs:
 *   - Every 5 minutes: check for sessions starting in ~24 hours
 *   - Every 5 minutes: check for sessions starting in ~1 hour
 *
 * Uses booking.reminders.sent24h / sent1h flags to prevent duplicates.
 * Only sends reminders for 'confirmed' bookings.
 */

/**
 * Build the session start DateTime from booking fields
 */
const getSessionStart = (booking) => {
  const [h, m] = booking.startTime.split(':').map(Number);
  const dt = new Date(booking.date);
  dt.setHours(h, m, 0, 0);
  return dt;
};

/**
 * Send 24-hour reminders
 */
const send24hReminders = async () => {
  try {
    const now = new Date();
    // Window: sessions starting between 23h50m and 24h10m from now
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 50 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000);

    const bookings = await Booking.find({
      status: 'confirmed',
      date: { $gte: windowStart, $lte: windowEnd },
      'reminders.sent24h': false
    })
      .populate('userId', 'name email')
      .populate('expertId', 'name email');

    if (bookings.length === 0) return;

    console.log(`⏰ [Reminder] Sending 24h reminders for ${bookings.length} session(s)`);

    for (const booking of bookings) {
      // Double-check the session start falls in the window
      const sessionStart = getSessionStart(booking);
      if (sessionStart < windowStart || sessionStart > windowEnd) continue;

      try {
        await NotificationService.notify24hReminder(booking);

        // Mark as sent — atomic update to prevent race conditions
        await Booking.updateOne(
          { _id: booking._id, 'reminders.sent24h': false },
          { $set: { 'reminders.sent24h': true } }
        );

        console.log(`  ✅ 24h reminder sent: booking ${booking._id}`);
      } catch (err) {
        console.error(`  ❌ 24h reminder failed for ${booking._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('24h reminder job error:', error.message);
  }
};

/**
 * Send 1-hour reminders
 */
const send1hReminders = async () => {
  try {
    const now = new Date();
    // Window: sessions starting between 50m and 70m from now
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 70 * 60 * 1000);

    const bookings = await Booking.find({
      status: 'confirmed',
      date: { $gte: windowStart, $lte: windowEnd },
      'reminders.sent1h': false
    })
      .populate('userId', 'name email')
      .populate('expertId', 'name email');

    if (bookings.length === 0) return;

    console.log(`⏰ [Reminder] Sending 1h reminders for ${bookings.length} session(s)`);

    for (const booking of bookings) {
      const sessionStart = getSessionStart(booking);
      if (sessionStart < windowStart || sessionStart > windowEnd) continue;

      try {
        await NotificationService.notify1hReminder(booking);

        await Booking.updateOne(
          { _id: booking._id, 'reminders.sent1h': false },
          { $set: { 'reminders.sent1h': true } }
        );

        console.log(`  ✅ 1h reminder sent: booking ${booking._id}`);
      } catch (err) {
        console.error(`  ❌ 1h reminder failed for ${booking._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('1h reminder job error:', error.message);
  }
};

/**
 * Reset reminder flags when a booking is rescheduled
 * Call this from bookingController after a reschedule
 */
const resetReminders = async (bookingId) => {
  await Booking.updateOne(
    { _id: bookingId },
    { $set: { 'reminders.sent24h': false, 'reminders.sent1h': false } }
  );
};

/**
 * Start all cron jobs — runs every 5 minutes
 */
const startReminderScheduler = () => {
  const EVERY_5_MIN = '0,5,10,15,20,25,30,35,40,45,50,55 * * * *';

  // 24-hour reminder
  cron.schedule(EVERY_5_MIN, async () => {
    await send24hReminders();
  });

  // 1-hour reminder
  cron.schedule(EVERY_5_MIN, async () => {
    await send1hReminders();
  });

  console.log('✅ Reminder scheduler started (checking every 5 minutes)');
};

module.exports = { startReminderScheduler, resetReminders };
