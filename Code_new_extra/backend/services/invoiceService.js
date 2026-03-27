const PDFDocument = require('pdfkit');

/**
 * Invoice Service — generates PDF invoices using PDFKit
 */

const drawLine = (doc, y) => {
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
};

const row = (doc, label, value, y) => {
  doc.fontSize(10).fillColor('#64748b').text(label, 50, y);
  doc.fontSize(10).fillColor('#1e293b').text(String(value), 300, y, { width: 245, align: 'right' });
};

/**
 * Build the PDF document and pipe it to a writable target.
 * @param {Object} booking  - fully populated booking
 * @param {stream.Writable} target - res (download) or a PassThrough (buffer)
 * @param {Object} headers  - optional { setHeader } for HTTP response
 */
const buildPDF = (booking, target, headers = null) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const invoiceNo = `INV-${booking._id.toString().slice(-8).toUpperCase()}`;

  if (headers) {
    headers.setHeader('Content-Type', 'application/pdf');
    headers.setHeader('Content-Disposition', `attachment; filename="${invoiceNo}.pdf"`);
  }

  doc.pipe(target);

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 90).fill('#4f46e5');
  doc.fontSize(26).fillColor('#ffffff').text('ExpertBook', 50, 28, { continued: true });
  doc.fontSize(11).fillColor('#c7d2fe').text('  Session Invoice', { baseline: 'middle' });
  doc.fontSize(10).fillColor('#a5b4fc').text('expertbook.app', 50, 58);

  doc.fontSize(10).fillColor('#64748b').text('Invoice No.', 380, 28);
  doc.fontSize(12).fillColor('#ffffff').text(invoiceNo, 380, 42);
  doc.fontSize(10).fillColor('#a5b4fc')
    .text(`Date: ${new Date(booking.payment?.paidAt || Date.now()).toLocaleDateString('en-NP', {
      year: 'numeric', month: 'long', day: 'numeric'
    })}`, 380, 60);

  doc.moveDown(4);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const badgeColor = booking.payment?.status === 'paid' ? '#16a34a' : '#dc2626';
  doc.roundedRect(50, 108, 70, 20, 4).fill(badgeColor);
  doc.fontSize(9).fillColor('#ffffff').text((booking.payment?.status || 'unpaid').toUpperCase(), 55, 113);

  drawLine(doc, 140);

  // ── Billed To / Expert ───────────────────────────────────────────────────────
  const sectionY = 155;
  doc.fontSize(9).fillColor('#94a3b8').text('BILLED TO', 50, sectionY);
  doc.fontSize(12).fillColor('#1e293b').text(booking.userId?.name || '—', 50, sectionY + 14);
  doc.fontSize(10).fillColor('#64748b').text(booking.userId?.email || '—', 50, sectionY + 30);

  doc.fontSize(9).fillColor('#94a3b8').text('EXPERT', 350, sectionY);
  doc.fontSize(12).fillColor('#1e293b').text(booking.expertId?.name || '—', 350, sectionY + 14);
  doc.fontSize(10).fillColor('#64748b').text(booking.expertId?.email || '—', 350, sectionY + 30);

  drawLine(doc, 215);

  // ── Session table ────────────────────────────────────────────────────────────
  const tableTop = 230;
  doc.rect(50, tableTop, 495, 24).fill('#f1f5f9');
  doc.fontSize(9).fillColor('#475569')
    .text('DESCRIPTION', 60, tableTop + 7)
    .text('DATE', 220, tableTop + 7)
    .text('TIME', 330, tableTop + 7)
    .text('AMOUNT', 460, tableTop + 7, { width: 80, align: 'right' });

  const rowY = tableTop + 34;
  const sessionDate = new Date(booking.date).toLocaleDateString('en-NP', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const topic = booking.topic ? `Session: ${booking.topic}` : 'Expert Consultation Session';

  doc.fontSize(10).fillColor('#1e293b')
    .text(topic, 60, rowY, { width: 155 })
    .text(sessionDate, 220, rowY)
    .text(`${booking.startTime} – ${booking.endTime}`, 330, rowY)
    .text(`NPR ${booking.payment?.amount || 0}`, 460, rowY, { width: 80, align: 'right' });

  drawLine(doc, rowY + 30);

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totY = rowY + 45;
  row(doc, 'Subtotal', `NPR ${booking.payment?.amount || 0}`, totY);
  row(doc, 'Tax (0%)', 'NPR 0', totY + 18);
  drawLine(doc, totY + 38);

  doc.rect(380, totY + 44, 165, 28).fill('#4f46e5');
  doc.fontSize(11).fillColor('#ffffff')
    .text('TOTAL', 390, totY + 51)
    .text(`NPR ${booking.payment?.amount || 0}`, 390, totY + 51, { width: 145, align: 'right' });

  // ── Payment details ──────────────────────────────────────────────────────────
  const txY = totY + 90;
  doc.fontSize(9).fillColor('#94a3b8').text('PAYMENT DETAILS', 50, txY);
  drawLine(doc, txY + 14);

  [
    ['Payment Gateway', (booking.payment?.gateway || '—').toUpperCase()],
    ['Transaction ID', booking.payment?.transactionId || booking.payment?.refId || booking.payment?.pidx || '—'],
    ['Payment Status', (booking.payment?.status || '—').toUpperCase()],
    ['Paid On', booking.payment?.paidAt ? new Date(booking.payment.paidAt).toLocaleString('en-NP') : '—'],
  ].forEach(([label, value], i) => {
    row(doc, label, value, txY + 24 + i * 20);
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  drawLine(doc, 720);
  doc.fontSize(9).fillColor('#94a3b8')
    .text('Thank you for using ExpertBook. This is a computer-generated invoice.', 50, 732, {
      align: 'center', width: 495
    });

  doc.end();
};

/**
 * Stream PDF directly to HTTP response (download)
 */
const generateInvoicePDF = (booking, res) => buildPDF(booking, res, res);

/**
 * Generate PDF into a Buffer (for email attachment)
 */
const generateInvoiceBuffer = (booking) => {
  return new Promise((resolve, reject) => {
    const { PassThrough } = require('stream');
    const pass = new PassThrough();
    const chunks = [];
    pass.on('data', chunk => chunks.push(chunk));
    pass.on('end', () => resolve(Buffer.concat(chunks)));
    pass.on('error', reject);
    buildPDF(booking, pass);
  });
};

module.exports = { generateInvoicePDF, generateInvoiceBuffer };
