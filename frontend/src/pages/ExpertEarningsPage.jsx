import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import bookingService from '../services/bookingService';
import userService from '../services/userService';

const ExpertEarningsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState('earned');

  useEffect(() => {
    Promise.all([bookingService.getBookings(), userService.getProfile()])
      .then(([b, p]) => { setBookings(b); setHourlyRate(p.hourlyRate || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completed = bookings.filter(b => b.status === 'completed');
  const pending   = bookings.filter(b => b.status === 'pending');
  const upcoming  = bookings.filter(b => b.status === 'confirmed');

  const totalEarnings     = completed.length * hourlyRate;
  const projectedEarnings = upcoming.length  * hourlyRate;
  const pendingEarnings   = pending.length   * hourlyRate;

  const CARDS = [
    { key: 'earned',    label: 'Total Earned',    value: `NPR ${totalEarnings}`,     sub: `${completed.length} sessions`, color: 'from-green-400 to-teal-500',   icon: '💵' },
    { key: 'projected', label: 'Projected',        value: `NPR ${projectedEarnings}`, sub: `${upcoming.length} upcoming`,  color: 'from-blue-400 to-indigo-500',  icon: '📈' },
    { key: 'pending',   label: 'Pending Approval', value: `NPR ${pendingEarnings}`,   sub: `${pending.length} requests`,   color: 'from-amber-400 to-orange-500', icon: '⏳' },
  ];

  const PANEL = {
    earned: {
      title: '💵 Earnings History',
      rows: completed,
      emptyIcon: '🏆',
      emptyMsg: 'No completed sessions yet',
      amountColor: 'text-green-600',
      badge: 'bg-green-100 text-green-700',
      badgeLabel: 'Completed',
      prefix: '+',
    },
    projected: {
      title: '📈 Projected Earnings',
      rows: upcoming,
      emptyIcon: '📅',
      emptyMsg: 'No upcoming sessions',
      amountColor: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      badgeLabel: 'Upcoming',
      prefix: '',
    },
    pending: {
      title: '⏳ Pending Payments',
      rows: pending,
      emptyIcon: '📭',
      emptyMsg: 'No pending requests',
      amountColor: 'text-amber-600',
      badge: 'bg-yellow-100 text-yellow-700',
      badgeLabel: 'Awaiting',
      prefix: '',
    },
  };

  const panel = PANEL[activeCard];
  const activeCardData = CARDS.find(c => c.key === activeCard);
  const panelTotal = panel.rows.length * hourlyRate;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/expert-dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">💰</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
            <p className="text-sm text-gray-500">Rate: NPR {hourlyRate}/hr</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Clickable summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {CARDS.map((card, i) => {
                const isActive = activeCard === card.key;
                return (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setActiveCard(card.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setActiveCard(card.key)}
                    className={`
                      bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white
                      cursor-pointer select-none outline-none
                      transition-all duration-200
                      hover:scale-[1.04] hover:shadow-xl
                      active:scale-[0.97]
                      ${isActive
                        ? 'scale-[1.04] shadow-xl ring-4 ring-white/50'
                        : 'opacity-75 hover:opacity-100'}
                    `}
                  >
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs font-semibold opacity-90 mt-0.5">{card.label}</p>
                    <p className="text-xs opacity-60 mt-0.5">{card.sub}</p>
                    {isActive && (
                      <div className="mt-2 inline-block bg-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        ▼ Viewing
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-gray-900 mb-4">{panel.title}</h2>

                {panel.rows.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">{panel.emptyIcon}</div>
                    <p className="text-gray-500 text-sm font-medium">{panel.emptyMsg}</p>
                    <p className="text-gray-400 text-xs mt-1">This section will populate as sessions progress.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {panel.rows.map((b, i) => (
                        <motion.div
                          key={b._id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${panel.badge}`}>
                              {b.userId?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{b.userId?.name}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {b.startTime}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${panel.amountColor}`}>
                              {panel.prefix}NPR {hourlyRate}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${panel.badge}`}>
                              {panel.badgeLabel}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">{activeCardData?.label} Total</span>
                      <span className={`text-sm font-bold ${panel.amountColor}`}>NPR {panelTotal}</span>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpertEarningsPage;
