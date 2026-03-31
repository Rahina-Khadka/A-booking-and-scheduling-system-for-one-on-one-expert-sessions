const Notification = require('../models/Notification');
const emailService = require('./emailService');

/**
 * Notification Service
 * Creates and manages notifications
 */
class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(userId, type, title, message, bookingId = null, link = null) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        bookingId,
        link
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify booking confirmation
   */
  static async notifyBookingConfirmed(booking) {
    try {
      // Notify the user
      await this.createNotification(
        booking.userId,
        'booking_confirmed',
        'Booking Confirmed',
        `Your session with ${booking.expertId.name} has been confirmed for ${new Date(booking.date).toLocaleDateString()}`,
        booking._id,
        `/bookings`
      );

      // Send email notification
      try {
        await emailService.sendBookingConfirmation(
          booking,
          booking.userId,
          booking.expertId
        );
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    } catch (error) {
      console.error('Error notifying booking confirmation:', error);
    }
  }

  /**
   * Notify booking rejection
   */
  static async notifyBookingRejected(booking) {
    try {
      // Notify the user
      await this.createNotification(
        booking.userId,
        'booking_rejected',
        'Booking Rejected',
        `Your session request with ${booking.expertId.name} has been rejected`,
        booking._id,
        `/bookings`
      );
    } catch (error) {
      console.error('Error notifying booking rejection:', error);
    }
  }

  /**
   * Notify booking cancellation
   */
  static async notifyBookingCancelled(booking, cancelledBy) {
    try {
      // Notify the other party
      const notifyUserId = cancelledBy === 'user' ? booking.expertId : booking.userId;
      const cancelledByUser = cancelledBy === 'user' ? booking.userId : booking.expertId;
      const recipient = cancelledBy === 'user' ? booking.expertId : booking.userId;

      await this.createNotification(
        notifyUserId,
        'booking_cancelled',
        'Booking Cancelled',
        `${cancelledByUser.name} has cancelled the session scheduled for ${new Date(booking.date).toLocaleDateString()}`,
        booking._id,
        `/bookings`
      );

      // Send email notification
      try {
        await emailService.sendBookingCancellation(
          booking,
          recipient,
          cancelledByUser
        );
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError);
      }
    } catch (error) {
      console.error('Error notifying booking cancellation:', error);
    }
  }

  /**
   * Notify new booking request (to expert)
   */
  static async notifyNewBookingRequest(booking) {
    try {
      await this.createNotification(
        booking.expertId,
        'booking_confirmed',
        'New Booking Request',
        `${booking.userId.name} has requested a session on ${new Date(booking.date).toLocaleDateString()}`,
        booking._id,
        `/bookings`
      );

      // Send email notification
      try {
        await emailService.sendNewBookingRequest(
          booking,
          booking.expertId,
          booking.userId
        );
      } catch (emailError) {
        console.error('Error sending new booking request email:', emailError);
      }
    } catch (error) {
      console.error('Error notifying new booking request:', error);
    }
  }

  /**
   * Notify session reminder — 24 hours before
   */
  static async notify24hReminder(booking) {
    try {
      const dateStr = new Date(booking.date).toLocaleDateString('en-NP', {
        weekday: 'long', month: 'short', day: 'numeric'
      });
      const message = `Your session with ${booking.expertId.name} is tomorrow (${dateStr}) at ${booking.startTime}`;

      await Promise.all([
        this.createNotification(booking.userId, 'session_reminder', '📅 Session Tomorrow', message, booking._id, `/session/${booking._id}`),
        this.createNotification(booking.expertId, 'session_reminder', '📅 Session Tomorrow', message, booking._id, `/session/${booking._id}`)
      ]);

      try {
        await emailService.send24hReminder(booking, booking.userId, booking.expertId);
      } catch (e) {
        console.error('24h reminder email error:', e.message);
      }
    } catch (error) {
      console.error('Error sending 24h reminder:', error);
    }
  }

  /**
   * Notify session reminder — 1 hour before
   */
  static async notify1hReminder(booking) {
    try {
      const message = `Your session with ${booking.expertId.name} starts in 1 hour at ${booking.startTime}`;

      await Promise.all([
        this.createNotification(booking.userId, 'session_reminder', '⏰ Starting in 1 Hour', message, booking._id, `/session/${booking._id}`),
        this.createNotification(booking.expertId, 'session_reminder', '⏰ Starting in 1 Hour', message, booking._id, `/session/${booking._id}`)
      ]);

      try {
        await emailService.sendSessionReminder(booking, booking.userId, booking.expertId);
      } catch (e) {
        console.error('1h reminder email error:', e.message);
      }
    } catch (error) {
      console.error('Error sending 1h reminder:', error);
    }
  }

  /**
   * Notify session reminder (1 hour before) — legacy kept for compatibility
   */
  static async notifySessionReminder(booking) {
    return this.notify1hReminder(booking);
  }

  /**
   * Notify booking rescheduled (both user and expert)
   */
  static async notifyBookingRescheduled(booking, rescheduledByName) {
    try {
      const dateStr = new Date(booking.date).toLocaleDateString();
      const message = `${rescheduledByName} rescheduled the session to ${dateStr} at ${booking.startTime}`;

      await this.createNotification(
        booking.userId,
        'booking_rescheduled',
        'Session Rescheduled',
        message,
        booking._id,
        `/bookings`
      );

      await this.createNotification(
        booking.expertId,
        'booking_rescheduled',
        'Session Rescheduled',
        message,
        booking._id,
        `/bookings`
      );
    } catch (error) {
      console.error('Error notifying booking reschedule:', error);
    }
  }

  /**
   * Notify refund status to user
   */
  static async notifyRefundStatus(booking) {
    try {
      const refund = booking.payment?.refund;
      const isProcessed = ['refunded', 'partial_refund'].includes(refund?.status);
      const isPending = refund?.status === 'pending';

      const title = isProcessed ? 'Refund Processed' : 'Refund Pending';
      const message = isProcessed
        ? `Your refund of NPR ${refund.amount} (${refund.policy === 'full' ? 'full' : '50% partial'} refund) has been processed for your cancelled session with ${booking.expertId.name}`
        : `Your refund of NPR ${refund.amount} is being processed and will reflect within 3–5 business days`;

      await this.createNotification(
        booking.userId,
        'refund_status',
        title,
        message,
        booking._id,
        `/bookings`
      );

      // Email notification
      try {
        await emailService.sendRefundEmail(booking);
      } catch (emailError) {
        console.error('Error sending refund email:', emailError);
      }
    } catch (error) {
      console.error('Error notifying refund status:', error);
    }
  }

  /**
   * Notify new review
   */
  static async notifyNewReview(expertId, userName, rating) {
    try {
      await this.createNotification(
        expertId,
        'new_review',
        'New Review',
        `${userName} rated you ${rating} stars`,
        null,
        `/dashboard`
      );
    } catch (error) {
      console.error('Error notifying new review:', error);
    }
  }
}

module.exports = NotificationService;
