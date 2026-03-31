import { useState, useRef } from 'react';
import paymentService from '../services/paymentService';
import userService from '../services/userService';
import api from '../services/api';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMethod, setActiveMethod] = useState(null); // 'khalti' | 'esewa' | 'scan'
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const fileRef = useRef(null);

  const amount = booking.expertId?.hourlyRate || 100;

  const handleKhalti = async () => {
    setLoading(true); setError('');
    try {
      const { paymentUrl } = await paymentService.initiateKhalti(String(booking._id));
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate Khalti payment');
      setLoading(false);
    }
  };

  const handleEsewa = async () => {
    setLoading(true); setError('');
    try {
      const payload = await paymentService.initiateEsewa(String(booking._id));
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payload.gatewayUrl;
      ['amount','tax_amount','total_amount','transaction_uuid','product_code',
       'product_service_charge','product_delivery_charge','success_url',
       'failure_url','signed_field_names','signature'].forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = key; input.value = payload[key];
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate eSewa payment');
      setLoading(false);
    }
  };

  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await userService.fileToBase64(file);
    setScanFile(file);
    setScanPreview(b64);
  };

  const handleScanSubmit = async () => {
    if (!scanPreview) { setError('Please upload your payment screenshot first.'); return; }
    setScanSubmitting(true); setError('');
    try {
      // Submit scan proof to backend — marks payment as pending verification
      await api.post(`/payments/scan-proof`, {
        bookingId: String(booking._id),
        scanImage: scanPreview,
        amount,
      });
      setScanSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setScanSubmitting(false);
    }
  };

  const METHODS = [
    { key: 'khalti', label: 'Khalti',    sub: 'Digital wallet & cards',   bg: 'bg-purple-600', border: 'border-purple-200 hover:border-purple-500 hover:bg-purple-50', icon: 'K' },
    { key: 'esewa',  label: 'eSewa',     sub: "Nepal's leading e-wallet",  bg: 'bg-green-600',  border: 'border-green-200 hover:border-green-500 hover:bg-green-50',   icon: 'e' },
    { key: 'scan',   label: 'Scan / QR', sub: 'Upload payment screenshot', bg: 'bg-blue-600',   border: 'border-blue-200 hover:border-blue-500 hover:bg-blue-50',     icon: '📷' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        {scanSuccess ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-green-700">Payment proof submitted!</p>
            <p className="text-xs text-gray-400 mt-1">Admin will verify and confirm shortly.</p>
          </div>
        ) : activeMethod === 'scan' ? (
          <div className="space-y-4">
            {booking.expertId?.paymentQr ? (
              <>
                <p className="text-sm text-gray-600 text-center font-medium">Scan the QR code below to pay</p>
                <div className="flex justify-center">
                  <img
                    src={booking.expertId.paymentQr}
                    alt="Payment QR"
                    className="max-h-52 rounded-2xl border border-gray-200 shadow-md object-contain"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-blue-800">Amount: NPR {amount}</p>
                  <p className="text-xs text-blue-600 mt-0.5">Pay to: <span className="font-medium">{booking.expertId?.name}</span></p>
                </div>
                <p className="text-xs text-gray-400 text-center">After paying, upload your payment screenshot below as proof.</p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">📵</p>
                <p className="text-sm text-gray-500">This expert hasn't set up a QR code yet.</p>
                <p className="text-xs text-gray-400 mt-1">Please use Khalti or eSewa instead.</p>
              </div>
            )}

            {/* Upload payment proof */}
            {booking.expertId?.paymentQr && (
              <>
                <p className="text-sm font-medium text-gray-700 text-center">Upload your payment screenshot</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    scanPreview ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {scanPreview ? (
                    <img src={scanPreview} alt="Payment proof" className="max-h-36 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div>
                      <p className="text-2xl mb-1">📷</p>
                      <p className="text-sm text-gray-500">Click to upload screenshot</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleScanUpload} className="hidden" />
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setActiveMethod(null); setScanFile(null); setScanPreview(null); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                ← Back
              </button>
              {booking.expertId?.paymentQr && (
                <button
                  onClick={handleScanSubmit}
                  disabled={!scanPreview || scanSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanSubmitting ? 'Submitting...' : 'Submit Proof'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4 text-center">Choose your payment method</p>
            <div className="space-y-3">
              {METHODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => {
                    if (m.key === 'khalti') handleKhalti();
                    else if (m.key === 'esewa') handleEsewa();
                    else setActiveMethod('scan');
                  }}
                  disabled={loading}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all disabled:opacity-50 ${m.border}`}
                >
                  <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-sm">{m.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            {loading && <p className="text-center text-sm text-gray-500 mt-4">Redirecting to payment gateway...</p>}
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Payments are securely processed and verified server-side
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
