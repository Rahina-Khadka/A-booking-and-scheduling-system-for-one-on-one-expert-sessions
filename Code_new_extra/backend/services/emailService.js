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
   * Send 24-hour advance reminder email to both user and expert
   */
  async send24hReminder(booking, user, expert) {
    const sessionDate = new Date(booking.date).toLocaleDateString('en-NP', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const subject = `⏰ Session Tomorrow at ${booking.startTime} — ExpertBook`;
    const makeHtml = (recipientName, otherName, role) => `
      <!DOCTYPE html><html><head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .banner { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 16px 0; }
        .details { background: white; padding: 15px; border-left: 4px solid #4f46e5; border-radius: 4px; margin: 12px 0; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style></head><body>
      <div class="container">
        <div class="header"><h1>📅 Session Tomorrow</h1></div>
        <div style="background:#f9f9f9;padding:20px;">
          <p>Hi ${recipientName},</p>
          <div class="banner">
            <strong>Reminder:</strong> Your session is scheduled for <strong>tomorrow</strong>.
          </div>
          <div class="details">
            <p><strong>${role}:</strong> ${otherName}</p>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Time:</strong> ${booking.startTime} – ${booking.endTime}</p>
            ${booking.topic ? `<p><strong>Topic:</strong> ${booking.topic}</p>` : ''}
          </div>
          <p>Make sure you're prepared and ready to join on time.</p>
          <a href="${process.env.CLIENT_URL}/session/${booking._id}" class="button">Open Session Room</a>
        </div>
        <div class="footer"><p>ExpertBook | © ${new Date().getFullYear()}</p></div>
      </div></body></html>`;

    await Promise.allSettled([
      this.sendEmail(user.email, subject, makeHtml(user.name, expert.name, 'Expert')),
      this.sendEmail(expert.email, subject, makeHtml(expert.name, user.name, 'Student'))
    ]);
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
  /**
   * Send refund notification email
   */
  async sendRefundEmail(booking) {
    const refund = booking.payment?.refund;
    const isProcessed = ['refunded', 'partial_refund'].includes(refund?.status);
    const subject = isProcessed
      ? `Refund Processed — NPR ${refund.amount} | ExpertBook`
      : `Refund Pending — NPR ${refund.amount} | ExpertBook`;

    const badgeColor = isProcessed ? '#16a34a' : '#d97706';
    const badgeText = isProcessed ? '✅ REFUND PROCESSED' : '⏳ REFUND PENDING';

    const html = `
      <!DOCTYPE html><html><head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .badge { display: inline-block; background: ${badgeColor}; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin: 12px 0; }
        .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4f46e5; border-radius: 4px; }
        .amount { font-size: 26px; font-weight: bold; color: #4f46e5; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
      </head><body>
      <div class="container">
        <div class="header"><h1>💰 Refund Update</h1></div>
        <div style="background:#f9f9f9;padding:20px;">
          <p>Hi ${booking.userId.name},</p>
          <div class="badge">${badgeText}</div>
          <div class="details">
            <p><strong>Cancelled Session:</strong> ${booking.expertId.name}</p>
            <p><strong>Session Date:</strong> ${new Date(booking.date).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Original Amount:</strong> NPR ${booking.payment?.amount}</p>
            <p><strong>Refund Policy:</strong> ${refund?.policy === 'full' ? 'Full refund (cancelled >24h before)' : refund?.policy === 'partial' ? '50% partial refund (cancelled 1–24h before)' : 'No refund'}</p>
            <p class="amount">Refund: NPR ${refund?.amount || 0}</p>
            ${refund?.refundTransactionId ? `<p><strong>Refund ID:</strong> ${refund.refundTransactionId}</p>` : ''}
            ${!isProcessed ? '<p style="color:#d97706">Your refund will be credited within 3–5 business days.</p>' : ''}
          </div>
        </div>
        <div class="footer"><p>ExpertBook | © ${new Date().getFullYear()}</p></div>
      </div>
      </body></html>
    `;

    await this.sendEmail(booking.userId.email, subject, html);
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(booking, pdfBuffer, invoiceNo) {
    const subject = `Your Invoice ${invoiceNo} - ExpertBook`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4f46e5; border-radius: 4px; }
          .amount { font-size: 28px; font-weight: bold; color: #4f46e5; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧾 Payment Receipt</h1>
            <p style="margin:0;opacity:0.8">${invoiceNo}</p>
          </div>
          <div class="content">
            <p>Hi ${booking.userId.name},</p>
            <p>Thank you for your payment. Your invoice is attached to this email.</p>
            <div class="details">
              <p><strong>Session with:</strong> ${booking.expertId.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${booking.startTime} – ${booking.endTime}</p>
              ${booking.topic ? `<p><strong>Topic:</strong> ${booking.topic}</p>` : ''}
              <p><strong>Transaction ID:</strong> ${booking.payment?.transactionId || booking.payment?.refId || '—'}</p>
              <p class="amount">NPR ${booking.payment?.amount || 0}</p>
            </div>
            <a href="${process.env.CLIENT_URL}/bookings" class="button">View My Bookings</a>
          </div>
          <div class="footer">
            <p>ExpertBook | © ${new Date().getFullYear()}</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `ExpertBook <${process.env.GMAIL_USER}>`,
      to: booking.userId.email,
      subject,
      html,
      attachments: [{
        filename: `${invoiceNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('Invoice email sent:', info.messageId);
    return info;
  }
}

module.exports = new EmailService();
