const nodemailer = require('nodemailer');

/**
 * Email Service
 * Sends email notifications using Gmail SMTP
 */
class EmailService {
  constructor() {
    // Create transporter with Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `Expert Booking System <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(booking, user, expert) {
    const subject = 'Booking Confirmed - Expert Booking System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Great news! Your session with <strong>${expert.name}</strong> has been confirmed.</p>
            
            <div class="details">
              <h3>Session Details:</h3>
              <p><strong>Expert:</strong> ${expert.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              ${booking.topic ? `<p><strong>Topic:</strong> ${booking.topic}</p>` : ''}
            </div>

            <p>You'll receive a reminder email 1 hour before your session starts.</p>
            
            <a href="${process.env.CLIENT_URL}/bookings" class="button">View My Bookings</a>
          </div>
          <div class="footer">
            <p>Expert Booking System | © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(booking, recipient, cancelledBy) {
    const subject = 'Booking Cancelled - Expert Booking System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #EF4444; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Booking Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${recipient.name},</p>
            <p>We're writing to inform you that a session has been cancelled by ${cancelledBy.name}.</p>
            
            <div class="details">
              <h3>Cancelled Session Details:</h3>
              <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              ${booking.topic ? `<p><strong>Topic:</strong> ${booking.topic}</p>` : ''}
            </div>

            <p>If you have any questions, please feel free to reach out.</p>
            
            <a href="${process.env.CLIENT_URL}/experts" class="button">Browse Experts</a>
          </div>
          <div class="footer">
            <p>Expert Booking System | © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(recipient.email, subject, html);
  }

  /**
   * Send session reminder email
   */
  async sendSessionReminder(booking, user, expert) {
    const subject = '⏰ Session Reminder - Starting in 1 Hour!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #F59E0B; }
          .button { display: inline-block; background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .highlight { background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Session Starting Soon!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Your session starts in 1 hour!</p>
            </div>
            
            <div class="details">
              <h3>Session Details:</h3>
              <p><strong>${user.role === 'expert' ? 'Student' : 'Expert'}:</strong> ${user.role === 'expert' ? booking.userId.name : expert.name}</p>
              <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              ${booking.topic ? `<p><strong>Topic:</strong> ${booking.topic}</p>` : ''}
            </div>

            <p>Make sure you're ready to join the session room at the scheduled time.</p>
            
            <a href="${process.env.CLIENT_URL}/session/${booking._id}" class="button">Join Session Room</a>
          </div>
          <div class="footer">
            <p>Expert Booking System | © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to both user and expert
    await this.sendEmail(user.email, subject, html);
    
    if (user.role !== 'expert') {
      const expertHtml = html.replace(user.name, expert.name);
      await this.sendEmail(expert.email, subject, expertHtml);
    }
  }

  /**
   * Send new booking request email to expert
   */
  async sendNewBookingRequest(booking, expert, user) {
    const subject = 'New Booking Request - Expert Booking System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #06B6D4; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #06B6D4; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Booking Request</h1>
          </div>
          <div class="content">
            <p>Hi ${expert.name},</p>
            <p>You have received a new booking request from <strong>${user.name}</strong>.</p>
            
            <div class="details">
              <h3>Request Details:</h3>
              <p><strong>Student:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              ${booking.topic ? `<p><strong>Topic:</strong> ${booking.topic}</p>` : ''}
              ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            </div>

            <p>Please review and respond to this booking request.</p>
            
            <a href="${process.env.CLIENT_URL}/bookings" class="button">Review Request</a>
          </div>
          <div class="footer">
            <p>Expert Booking System | © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(expert.email, subject, html);
  }
}

module.exports = new EmailService();
