import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import bookingService from '../services/bookingService';

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'expired',   label: 'Expired' },
  { key: 'missed',    label: 'Missed' },
  { key: 'payments',  label: '💰 Payments' },
];

const STATUS_STYLE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled: 'bg-stone-100 text-stone-500 border border-stone-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
  expired:   'bg-orange-50 text-orange-700 border border-orange-200',
  missed:    'bg-red-50 text-red-700 border border-red-200',
};

const EMPTY = {
  all:       { icon: '📋', msg: 'No sessions found' },
  pending:   { icon: '⏳', msg: 'No pending requests' },
  confirmed: { icon: '📅', msg: 'No upcoming sessions scheduled' },
  completed: { icon: '✅', msg: 'No completed sessions yet' },
  cancelled: { icon: '❌', msg: 'No cancelled sessions' },
  expired:   { icon: '⏰', msg: 'No expired sessions' },
  missed:    { icon: '😔', msg: 'No missed sessions' },
};

const ExpertSessionsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    bookingService.getBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkComplete = async (booking) => {
    const id = String(booking._id);
    setCompleting(id);
    try {
      await bookingService.updateBookingStatus(id, 'completed');
      setBookings(prev => prev.map(b => String(b._id) === id ? { ...b, status: 'completed' } : b));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to mark complete');
    } finally {
      setCompleting(null);
    }
  };

  const filtered = activeTab === 'all' || activeTab === 'payments'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const tabCount = (key) => {
    if (key === 'payments') return bookings.filter(b => b.payment?.status === 'paid').length;
    return key === 'all' ? bookings.length : bookings.filter(b => b.status === key).length;
  };

  // Payment stats
  const paidBookings = bookings.filter(b => b.payment?.status === 'paid');
  const totalIncome = paidBookings.reduce((sum, b) => sum + (b.payment?.amount || 0), 0);
  const pendingPayments = bookings.filter(b => b.payment?.status === 'pending');
  const pendingAmount = pendingPayments.reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/expert-dashboard" className="text-stone-400 hover:text-accent-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">📅</div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">My Sessions</h1>
            <p className="text-sm text-stone-500">{bookings.length} total session{bookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap bg-white rounded-2xl border border-stone-200 shadow-sm p-1.5 mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-accent-600 text-white shadow-sm' : 'text-stone-500 hover:text-accent-600'
              }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === t.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500 border border-stone-200'
              }`}>
                {tabCount(t.key)}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'payments' ? (
          /* ── Payments Tab ── */
          <div className="space-y-6">
            {/* Income Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-5 text-center">
                <p className="text-xs text-stone-500 mb-1">Total Income</p>
                <p className="text-3xl font-bold text-green-600">NPR {totalIncome}</p>
                <p className="text-xs text-stone-400 mt-1">{paidBookings.length} paid session{paidBookings.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 text-center">
                <p className="text-xs text-stone-500 mb-1">Pending Verification</p>
                <p className="text-3xl font-bold text-amber-600">NPR {pendingAmount}</p>
                <p className="text-xs text-stone-400 mt-1">{pendingPayments.length} awaiting approval</p>
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 text-center">
                <p className="text-xs text-stone-500 mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-stone-700">{bookings.length}</p>
                <p className="text-xs text-stone-400 mt-1">{bookings.filter(b => b.status === 'completed').length} completed</p>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="font-bold text-stone-900">Payment History</h2>
              </div>
              {bookings.filter(b => b.payment?.status && b.payment.status !== 'unpaid').length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-2">💳</p>
                  <p className="text-stone-400 text-sm">No payment records yet</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {bookings
                    .filter(b => b.payment?.status && b.payment.status !== 'unpaid')
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .map(b => (
                      <div key={String(b._id)} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-bold text-sm flex-shrink-0">
                            {b.userId?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900 text-sm">{b.userId?.name}</p>
                            <p className="text-xs text-stone-400">
                              {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {b.startTime}
                            </p>
                            {b.topic && <p className="text-xs text-stone-400">Topic: {b.topic}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-stone-900">NPR {b.payment?.amount || 0}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            b.payment?.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                            b.payment?.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {b.payment?.status === 'paid' ? '✅ Paid' :
                             b.payment?.status === 'pending' ? '⏳ Verifying' : '❌ Failed'}
                          </span>
                          {b.payment?.gateway && (
                            <p className="text-xs text-stone-400 mt-0.5 capitalize">{b.payment.gateway}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">{EMPTY[activeTab]?.icon}</div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">{EMPTY[activeTab]?.msg}</h3>
            <p className="text-sm text-stone-400">Sessions will appear here once booked.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b, i) => (
              <motion.div key={String(b._id)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {b.userId?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{b.userId?.name}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(b.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} · {b.startTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[b.status] || 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                      {b.status}
                    </span>
                    {/* Payment badge */}
                    {b.payment?.status && b.payment.status !== 'unpaid' && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        b.payment.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                        b.payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {b.payment.status === 'paid' ? `💰 NPR ${b.payment.amount}` :
                         b.payment.status === 'pending' ? '⏳ Verifying' : '❌ Failed'}
                      </span>
                    )}
                    {b.status === 'confirmed' && (
                      <>
                        <Link to={`/session/${String(b._id)}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors">
                          Join →
                        </Link>
                        <button
                          disabled={completing === String(b._id)}
                          onClick={() => handleMarkComplete(b)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 transition-colors"
                        >
                          {completing === String(b._id) ? '...' : '✓ Complete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {b.topic && (
                  <p className="text-xs text-stone-400 mt-2">Topic: {b.topic}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertSessionsPage;
