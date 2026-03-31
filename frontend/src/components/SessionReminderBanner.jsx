import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import bookingService from '../services/bookingService';

/**
 * SessionReminderBanner
 * Shows a live countdown banner when a confirmed session is starting within 60 minutes.
 * Polls every 30 seconds.
 */
const SessionReminderBanner = () => {
  const [upcomingSoon, setUpcomingSoon] = useState(null); // { booking, minutesLeft }
  const [dismissed, setDismissed] = useState(null); // dismissed booking id

  const checkUpcoming = async () => {
    try {
      const bookings = await bookingService.getBookings();
      const now = new Date();

      const soon = bookings
        .filter(b => b.status === 'confirmed')
        .map(b => {
          const [h, m] = b.startTime.split(':').map(Number);
          const sessionDate = new Date(b.date);
          sessionDate.setHours(h, m, 0, 0);
          const diffMs = sessionDate - now;
          const minutesLeft = Math.floor(diffMs / 60000);
          return { booking: b, minutesLeft, sessionDate };
        })
        .filter(({ minutesLeft }) => minutesLeft >= 0 && minutesLeft <= 60)
        .sort((a, b) => a.minutesLeft - b.minutesLeft);

      if (soon.length > 0 && soon[0].booking._id !== dismissed) {
        setUpcomingSoon(soon[0]);
      } else {
        setUpcomingSoon(null);
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 30000);
    return () => clearInterval(interval);
  }, [dismissed]);

  if (!upcomingSoon) return null;

  const { booking, minutesLeft } = upcomingSoon;
  const isNow = minutesLeft <= 5;
  const otherName = booking.expertId?.name || booking.userId?.name || 'participant';
  const bookingId = String(booking._id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-16 left-0 right-0 z-40 mx-auto max-w-3xl px-4 pt-2`}
      >
        <div className={`rounded-2xl shadow-lg px-5 py-3.5 flex items-center justify-between gap-4 ${
          isNow
            ? 'bg-green-500 text-white'
            : 'bg-indigo-600 text-white'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-2xl flex-shrink-0 ${isNow ? 'animate-bounce' : 'animate-pulse'}`}>
              {isNow ? '🟢' : '⏰'}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">
                {isNow
                  ? `Your session with ${otherName} is starting now!`
                  : `Session with ${otherName} starts in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                {new Date(booking.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} · {booking.startTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/session/${bookingId}`}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                isNow
                  ? 'bg-white text-green-600 hover:bg-green-50'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Join Now →
            </Link>
            <button
              onClick={() => setDismissed(booking._id)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionReminderBanner;
