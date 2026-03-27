import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';

/**
 * PaymentVerifyPage
 * Handles redirect callbacks from both Khalti and eSewa.
 * Does server-side verification before confirming the booking.
 */
const PaymentVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your payment...');
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      const gateway = searchParams.get('gateway');
      const bookingId = searchParams.get('bookingId');

      try {
        if (gateway === 'khalti') {
          const pidx = searchParams.get('pidx');
          if (!pidx) throw new Error('Missing payment identifier');
          await paymentService.verifyKhalti(pidx, bookingId);

        } else if (gateway === 'esewa') {
          const encodedData = searchParams.get('data');
          if (!encodedData) throw new Error('Missing eSewa response data');
          await paymentService.verifyEsewa(encodedData, bookingId);

        } else {
          throw new Error('Unknown payment gateway');
        }

        setStatus('Payment successful! Redirecting...');
        setTimeout(() => navigate('/bookings'), 2000);

      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Payment verification failed';
        setError(msg);
        setStatus('');
        setTimeout(() => navigate(`/payment/failed?bookingId=${bookingId}`), 3000);
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-cyan-500">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full mx-4">
        {!error ? (
          <>
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-lg font-semibold text-gray-800">{status}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-red-500 text-3xl">✕</span>
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">Payment Failed</p>
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-gray-400 mt-3">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentVerifyPage;
