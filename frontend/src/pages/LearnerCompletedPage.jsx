import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import bookingService from '../services/bookingService';
import PaymentModal from '../components/PaymentModal';
import ReviewModal from '../components/ReviewModal';
import reviewService from '../services/reviewService';

const LearnerCompletedPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBooking, setPayingBooking] = useState(null);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getBookings();
      const completed = data.filter(b => b.status === 'completed');
      setBookings(completed);

      // Check which bookings already have a review
      const checks = await Promise.all(
        completed.map(b =>
          reviewService.canReview(b._id)
            .then(r => ({ id: b._id, canReview: r.canReview }))
            .catch(() => ({ id: b._id, canReview: false }))
        )
      );
      setReviewedIds(new Set(checks.filter(c => !c.canReview).map(c => c.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  return (
    <>
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-stone-400 hover:text-accent-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Completed Sessions</h1>
            <p className="text-sm text-stone-500">{bookings.length} session{bookings.length !== 1 ? 's' : ''} completed</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No completed sessions yet</h3>
            <p className="text-sm text-stone-400 mb-6">Book a session with an expert to get started.</p>
            <Link to="/experts" className="px-6 py-2.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition-colors">
              Find Experts
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b, i) => (
              <motion.div key={b._id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {b.expertId?.profilePicture
                        ? <img src={b.expertId.profilePicture} alt="" className="w-full h-full object-cover" />
                        : b.expertId?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{b.expertId?.name}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(b.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })} · {b.startTime}
                      </p>
                      {b.topic && <p className="text-xs text-stone-400 mt-0.5">Topic: {b.topic}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full">✓ Completed</span>
                    {b.payment?.status === 'paid' ? (
                      <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">💰 Paid</span>
                    ) : b.payment?.status === 'pending' ? (
                      <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-full">⏳ Verifying</span>
                    ) : (
                      <button
                        onClick={() => setPayingBooking(b)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition-colors"
                      >
                        Pay Now
                      </button>
                    )}
                    {b.payment?.status === 'paid' && (
                      reviewedIds.has(b._id) ? (
                        <span className="text-xs text-stone-400 font-medium">⭐ Reviewed</span>
                      ) : (
                        <button
                          onClick={() => setReviewingBooking(b)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          ⭐ Rate
                        </button>
                      )
                    )}
                    <Link to={`/experts/${b.expertId?._id}`}
                      className="text-xs text-accent-600 font-medium hover:underline">View Expert</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    {payingBooking && (
      <PaymentModal
        booking={payingBooking}
        onClose={() => setPayingBooking(null)}
        onSuccess={() => { setPayingBooking(null); fetchBookings(); }}
      />
    )}
    {reviewingBooking && (
      <ReviewModal
        booking={reviewingBooking}
        onClose={() => setReviewingBooking(null)}
        onSuccess={() => { setReviewingBooking(null); fetchBookings(); }}
      />
    )}
    </>
  );
};

export default LearnerCompletedPage;
