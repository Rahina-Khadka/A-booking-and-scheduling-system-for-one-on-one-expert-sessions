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
];

const STATUS_STYLE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled: 'bg-stone-100 text-stone-500 border border-stone-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
};

const EMPTY = {
  all:       { icon: '📋', msg: 'No sessions found' },
  pending:   { icon: '⏳', msg: 'No pending requests' },
  confirmed: { icon: '📅', msg: 'No upcoming sessions scheduled' },
  completed: { icon: '✅', msg: 'No completed sessions yet' },
  cancelled: { icon: '❌', msg: 'No cancelled sessions' },
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

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);

  const tabCount = (key) => key === 'all' ? bookings.length : bookings.filter(b => b.status === key).length;

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
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[b.status] || 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                      {b.status}
                    </span>
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
                    {b.status === 'completed' && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        b.payment?.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                        b.payment?.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {b.payment?.status === 'paid' ? '💰 Paid' : b.payment?.status === 'pending' ? '⏳ Verifying' : '⚠ Unpaid'}
                      </span>
                    )}
                  </div>
                </div>
                {b.topic && (
                  <p className="text-xs text-stone-400 mt-2 pl-13">Topic: {b.topic}</p>
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
