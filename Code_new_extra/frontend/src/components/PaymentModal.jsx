import { useState } from 'react';
import paymentService from '../services/paymentService';

/**
 * PaymentModal
 * Lets user choose Khalti or eSewa and initiates payment
 */
const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = booking.expertId?.hourlyRate || 100;

  // ── Khalti ──────────────────────────────────────────────────────────────────
  const handleKhalti = async () => {
    setLoading(true);
    setError('');
    try {
      const { paymentUrl } = await paymentService.initiateKhalti(booking._id);
      // Redirect to Khalti — they'll come back to /payment/verify?gateway=khalti&bookingId=...
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate Khalti payment');
      setLoading(false);
    }
  };

  // ── eSewa ────────────────────────────────────────────────────────────────────
  const handleEsewa = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await paymentService.initiateEsewa(booking._id);

      // Dynamically create and submit a form to eSewa gateway
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payload.gatewayUrl;

      const fields = [
        'amount', 'tax_amount', 'total_amount', 'transaction_uuid',
        'product_code', 'product_service_charge', 'product_delivery_charge',
        'success_url', 'failure_url', 'signed_field_names', 'signature'
      ];

      fields.forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payload[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate eSewa payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Pay for Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-600">Session with <span className="font-semibold">{booking.expertId?.name}</span></p>
          <p className="text-2xl font-bold text-gray-900 mt-1">NPR {amount}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4 text-center">Choose your payment method</p>

        <div className="space-y-3">
          {/* Khalti */}
          <button
            onClick={handleKhalti}
            disabled={loading}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Khalti</p>
              <p className="text-xs text-gray-500">Digital wallet & cards</p>
            </div>
          </button>

          {/* eSewa */}
          <button
            onClick={handleEsewa}
            disabled={loading}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">e</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">eSewa</p>
              <p className="text-xs text-gray-500">Nepal's leading e-wallet</p>
            </div>
          </button>
        </div>

        {loading && (
          <p className="text-center text-sm text-gray-500 mt-4">Redirecting to payment gateway...</p>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Payments are securely processed and verified server-side
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
