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
   * Notify session reminder (1 hour before)
   */
  static async notifySessionReminder(booking) {
    try {
      // Notify both user and expert
      const message = `Your session is starting in 1 hour at ${booking.startTime}`;

      await this.createNotification(
        booking.userId,
        'session_reminder',
        'Session Reminder',
        message,
        booking._id,
        `/session/${booking._id}`
      );

      await this.createNotification(
        booking.expertId,
        'session_reminder',
        'Session Reminder',
        message,
        booking._id,
        `/session/${booking._id}`
      );

      // Send email reminders
      try {
        await emailService.sendSessionReminder(
          booking,
          booking.userId,
          booking.expertId
        );
      } catch (emailError) {
        console.error('Error sending session reminder email:', emailError);
      }
    } catch (error) {
      console.error('Error notifying session reminder:', error);
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
