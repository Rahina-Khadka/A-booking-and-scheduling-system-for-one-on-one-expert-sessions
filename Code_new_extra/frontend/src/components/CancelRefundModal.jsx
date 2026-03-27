import { useState, useEffect } from 'react';
import refundService from '../services/refundService';

/**
 * CancelRefundModal
 * Shows refund eligibility before confirming cancellation.
 */
const CancelRefundModal = ({ booking, onClose, onSuccess }) => {
  const [eligibility, setEligibility] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refundService.getRefundStatus(booking._id)
      .then(data => setEligibility(data.eligibility))
      .catch(() => setEligibility(null))
      .finally(() => setLoading(false));
  }, [booking._id]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await refundService.cancelAndRefund(booking._id, reason);
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setSubmitting(false);
    }
  };

  const wasPaid = booking.payment?.status === 'paid';

  const policyLabel = {
    full: '✅ Full refund (100%)',
    partial: '⚠️ Partial refund (50%)',
    none: '❌ No refund applicable'
  };

  const policyColor = {
    full: 'bg-green-50 border-green-200 text-green-800',
    partial: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    none: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Session with <span className="font-semibold">{booking.expertId?.name}</span> on{' '}
          {new Date(booking.date).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>

        {/* Refund policy banner */}
        {wasPaid && (
          <div className={`border rounded-xl p-4 mb-4 ${loading ? 'bg-gray-50 border-gray-200' : policyColor[eligibility?.policy || 'none']}`}>
            {loading ? (
              <p className="text-sm text-gray-500">Checking refund eligibility...</p>
            ) : eligibility ? (
              <>
                <p className="font-semibold text-sm">{policyLabel[eligibility.policy]}</p>
                {eligibility.refundAmount > 0 && (
                  <p className="text-sm mt-1">
                    You will receive <span className="font-bold">NPR {eligibility.refundAmount}</span> back
                    {eligibility.policy === 'partial' && ' (50% of NPR ' + booking.payment?.amount + ')'}
                  </p>
                )}
                {eligibility.policy === 'none' && (
                  <p className="text-sm mt-1">Session is within 1 hour — no refund policy applies.</p>
                )}
                {eligibility.policy === 'partial' && (
                  <p className="text-xs mt-1 opacity-75">Cancelled within 24 hours of session start.</p>
                )}
                {eligibility.policy === 'full' && (
                  <p className="text-xs mt-1 opacity-75">Cancelled more than 24 hours before session.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Could not determine refund eligibility.</p>
            )}
          </div>
        )}

        {!wasPaid && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600">This booking has no payment — it will simply be cancelled.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Why are you cancelling?"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Keep Booking
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:bg-gray-400"
          >
            {submitting ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelRefundModal;
