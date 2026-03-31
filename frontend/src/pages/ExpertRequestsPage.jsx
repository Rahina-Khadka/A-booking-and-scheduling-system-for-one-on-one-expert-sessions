import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import bookingService from '../services/bookingService';

const ExpertRequestsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // tracks which booking is being actioned

  useEffect(() => {
    bookingService.getBookings()
      .then(data => setBookings(data.filter(b => b.status === 'pending')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (booking, status) => {
    // Always extract a plain string ID — never pass the whole object
    const id = String(booking._id);
    setActionLoading(id);
    try {
      await bookingService.updateBookingStatus(id, status);
      setBookings(prev => prev.filter(b => String(b._id) !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/expert-dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">⏳</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Requests</h1>
            <p className="text-sm text-gray-500">
              {bookings.length} request{bookings.length !== 1 ? 's' : ''} awaiting your response
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No pending requests yet</h3>
            <p className="text-sm text-gray-400">When users book a session with you, they'll appear here.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b, i) => {
              const bookingId = String(b._id);
              const isActioning = actionLoading === bookingId;
              return (
                <motion.div key={bookingId}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5 hover:shadow-md transition-shadow">

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {b.userId?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{b.userId?.name}</p>
                        <p className="text-xs text-gray-400">{b.userId?.email}</p>
                      </div>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Pending
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(b.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Time</p>
                      <p className="font-semibold text-gray-800">{b.startTime} – {b.endTime}</p>
                    </div>
                    {b.topic && (
                      <div className="bg-gray-50 rounded-xl p-3 col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-400 mb-0.5">Topic</p>
                        <p className="font-semibold text-gray-800 truncate">{b.topic}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      disabled={isActioning}
                      onClick={() => handleAction(b, 'confirmed')}
                      className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isActioning ? '...' : '✓ Accept'}
                    </button>
                    <button
                      disabled={isActioning}
                      onClick={() => handleAction(b, 'rejected')}
                      className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isActioning ? '...' : '✗ Decline'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertRequestsPage;
