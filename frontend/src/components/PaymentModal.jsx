import { useState, useRef } from 'react';
import paymentService from '../services/paymentService';
import userService from '../services/userService';
import api from '../services/api';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMethod, setActiveMethod] = useState(null);
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const fileRef = useRef(null);

  const amount = booking.sessionPrice || booking.expertId?.hourlyRate || 100;
  const payTo = booking.expertId?.paymentName || booking.expertId?.name || 'Expert';
  const expertQr = booking.expertId?.paymentQr || null;

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
    if (!confirmed) { setError(`Please confirm you have paid NPR ${amount}.`); return; }
    setScanSubmitting(true); setError('');
    try {
      await api.post('/payments/scan-proof', {
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
    { key: 'scan',   label: 'Manual Pay',sub: 'Pay via eSewa/Khalti app',  bg: 'bg-blue-600',   border: 'border-blue-200 hover:border-blue-500 hover:bg-blue-50',     icon: 'P' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl px-5 pt-5 pb-3 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-stone-900">Pay for Session</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-3">

        <div className="bg-stone-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500">Session with <span className="font-semibold text-stone-700">{booking.expertId?.name}</span></p>
            <p className="text-xl font-bold text-stone-900">NPR {amount}</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Fixed price</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        {scanSuccess ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-green-700">Payment proof submitted!</p>
            <p className="text-xs text-stone-400 mt-1">Admin will verify and confirm shortly.</p>
          </div>
        ) : activeMethod === 'scan' ? (
          <div className="space-y-3">
            {/* Amount + QR side by side if QR exists */}
            {expertQr ? (
              <div className="flex gap-3 items-center bg-stone-50 border border-stone-200 rounded-xl p-3">
                <img src={expertQr} alt="Payment QR" className="w-24 h-24 rounded-lg object-contain border border-stone-200 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-500 mb-0.5">Scan & pay</p>
                  <p className="text-2xl font-bold text-stone-900">NPR {amount}</p>
                  <p className="text-xs text-stone-600 mt-1">To: <span className="font-semibold">{payTo}</span></p>
                  <p className="text-xs text-stone-400 mt-1">Use eSewa or Khalti app</p>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-stone-700">How to pay:</p>
                <p className="text-xs text-stone-600">1. Open eSewa or Khalti → Send Money</p>
                <p className="text-xs text-stone-600">2. ID: <span className="font-bold">{payTo}</span> · Amount: <span className="font-bold text-green-700">NPR {amount}</span></p>
                <p className="text-xs text-stone-600">3. Take a screenshot</p>
              </div>
            )}

            {/* Upload proof */}
            <div onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                scanPreview ? 'border-blue-400 bg-blue-50' : 'border-stone-200 hover:border-blue-300'
              }`}>
              {scanPreview ? (
                <img src={scanPreview} alt="Payment proof" className="max-h-28 mx-auto rounded-lg object-contain" />
              ) : (
                <div>
                  <p className="text-xl mb-0.5">📷</p>
                  <p className="text-xs text-stone-500">Tap to upload payment screenshot</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleScanUpload} className="hidden" />

            {/* Confirmation checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs text-stone-600">
                I confirm I paid <span className="font-bold">NPR {amount}</span> to <span className="font-semibold">{payTo}</span>
              </span>
            </label>

            <div className="flex gap-2">
              <button onClick={() => { setActiveMethod(null); setScanFile(null); setScanPreview(null); setError(''); setConfirmed(false); }}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50">
                ← Back
              </button>
              <button onClick={handleScanSubmit} disabled={!scanPreview || !confirmed || scanSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {scanSubmitting ? 'Submitting...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-4 text-center">Choose your payment method</p>
            <div className="space-y-3">
              {METHODS.map(m => (
                <button key={m.key}
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
                    <p className="font-semibold text-stone-900">{m.label}</p>
                    <p className="text-xs text-stone-500">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            {loading && <p className="text-center text-sm text-stone-500 mt-4">Redirecting to payment gateway...</p>}
          </>
        )}

        <p className="text-center text-xs text-stone-400 pt-1 pb-2">
          Payments are securely processed and verified server-side
        </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
