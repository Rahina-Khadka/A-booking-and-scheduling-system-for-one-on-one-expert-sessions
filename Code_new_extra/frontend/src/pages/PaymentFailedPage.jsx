import { useSearchParams, Link } from 'react-router-dom';

const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-500 text-3xl">✕</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your payment was not completed. Your booking is still saved — you can try paying again.
        </p>
        <div className="space-y-3">
          <Link
            to="/bookings"
            className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Go to My Bookings
          </Link>
          <Link
            to="/"
            className="block w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
