const axios = require('axios');
const crypto = require('crypto');

/**
 * Payment Service
 * Handles Khalti and eSewa payment initiation and verification
 */

// ─── KHALTI ──────────────────────────────────────────────────────────────────

/**
 * Initiate Khalti payment — returns a payment URL (pidx)
 * amount must be in PAISA (NPR × 100)
 */
const initiateKhalti = async ({ amount, bookingId, customerName, customerEmail, customerPhone }) => {
  const payload = {
    return_url: `${process.env.CLIENT_URL}/payment/verify?gateway=khalti&bookingId=${bookingId}`,
    website_url: process.env.CLIENT_URL,
    amount,                          // paisa
    purchase_order_id: bookingId.toString(),
    purchase_order_name: `ExpertBook Session #${bookingId}`,
    customer_info: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone || '9800000000'
    }
  };

  const response = await axios.post(
    'https://a.khalti.com/api/v2/epayment/initiate/',
    payload,
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Returns { pidx, payment_url, expires_at, expires_in, ... }
  return response.data;
};

/**
 * Verify Khalti payment server-side using pidx
 */
const verifyKhalti = async (pidx) => {
  const response = await axios.post(
    'https://a.khalti.com/api/v2/epayment/lookup/',
    { pidx },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  // Returns { pidx, total_amount, status, transaction_id, ... }
  return response.data;
};

// ─── ESEWA ────────────────────────────────────────────────────────────────────

/**
 * Generate eSewa HMAC-SHA256 signature
 * message format: "total_amount=X,transaction_uuid=Y,product_code=Z"
 */
const generateEsewaSignature = (totalAmount, transactionUuid) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${process.env.ESEWA_MERCHANT_CODE}`;
  return crypto
    .createHmac('sha256', process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');
};

/**
 * Build eSewa form payload — frontend POSTs this to eSewa gateway
 * amount in NPR (rupees, not paisa)
 */
const buildEsewaPayload = ({ amount, bookingId }) => {
  const transactionUuid = `${bookingId}-${Date.now()}`;
  const signature = generateEsewaSignature(amount, transactionUuid);

  return {
    amount,
    tax_amount: 0,
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: process.env.ESEWA_MERCHANT_CODE,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: `${process.env.CLIENT_URL}/payment/verify?gateway=esewa&bookingId=${bookingId}`,
    failure_url: `${process.env.CLIENT_URL}/payment/failed?bookingId=${bookingId}`,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature,
    gatewayUrl: process.env.ESEWA_GATEWAY_URL
  };
};

/**
 * Verify eSewa payment server-side
 * encodedData is the base64 response from eSewa success redirect
 */
const verifyEsewa = async (encodedData) => {
  const decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
  // decoded: { transaction_code, status, total_amount, transaction_uuid, product_code, signed_field_names, signature }

  // Verify signature
  const message = `transaction_code=${decoded.transaction_code},status=${decoded.status},total_amount=${decoded.total_amount},transaction_uuid=${decoded.transaction_uuid},product_code=${decoded.product_code},signed_field_names=${decoded.signed_field_names}`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');

  if (expectedSig !== decoded.signature) {
    throw new Error('eSewa signature verification failed');
  }

  if (decoded.status !== 'COMPLETE') {
    throw new Error(`eSewa payment status: ${decoded.status}`);
  }

  return decoded;
};

// ─── REFUND ───────────────────────────────────────────────────────────────────

/**
 * Refund policy:
 *   > 24 hours before session  → full refund (100%)
 *   1–24 hours before session  → partial refund (50%)
 *   < 1 hour before session    → no refund
 *
 * @param {Date} sessionDate  booking.date
 * @param {String} startTime  booking.startTime  e.g. "14:30"
 * @returns {{ policy: 'full'|'partial'|'none', percent: number }}
 */
const getRefundPolicy = (sessionDate, startTime) => {
  const [h, m] = startTime.split(':').map(Number);
  const sessionStart = new Date(sessionDate);
  sessionStart.setHours(h, m, 0, 0);

  const hoursUntil = (sessionStart - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil > 24) return { policy: 'full', percent: 100 };
  if (hoursUntil > 1)  return { policy: 'partial', percent: 50 };
  return { policy: 'none', percent: 0 };
};

/**
 * Process Khalti refund via their refund API
 * Khalti refund: POST https://a.khalti.com/api/v2/epayment/refund/
 * amount in PAISA
 */
const refundKhalti = async (pidx, amountPaisa) => {
  const response = await axios.post(
    'https://a.khalti.com/api/v2/epayment/refund/',
    { pidx, amount: amountPaisa },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  // Returns { pidx, refund_id, status, ... }
  return response.data;
};

/**
 * eSewa does not have a programmatic refund API for merchants.
 * Refunds must be initiated manually from the eSewa merchant dashboard.
 * We record the refund as "pending" and notify the admin.
 */
const refundEsewa = async (transactionId, amount) => {
  // Manual process — return a structured pending response
  return {
    status: 'PENDING_MANUAL',
    transactionId,
    amount,
    note: 'eSewa refunds require manual processing via merchant dashboard'
  };
};

module.exports = {
  initiateKhalti,
  verifyKhalti,
  buildEsewaPayload,
  verifyEsewa,
  getRefundPolicy,
  refundKhalti,
  refundEsewa
};
