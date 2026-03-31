import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import bookingService from '../services/bookingService';

const LearnerUpcomingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getBookings()
      .then(data => setBookings(data.filter(b => b.status === 'confirmed')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">📅</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Sessions</h1>
            <p className="text-sm text-gray-500">{bookings.length} session{bookings.length !== 1 ? 's' : ''} scheduled</p>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No upcoming sessions</h3>
            <p className="text-sm text-gray-400 mb-6">Book a session with an expert and it will appear here once confirmed.</p>
            <Link to="/experts" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Find Experts
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b, i) => (
              <motion.div key={b._id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {b.expertId?.profilePicture
                        ? <img src={b.expertId.profilePicture} alt="" className="w-full h-full object-cover" />
                        : b.expertId?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.expertId?.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(b.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })} · {b.startTime}
                      </p>
                      {b.topic && <p className="text-xs text-gray-400 mt-0.5">Topic: {b.topic}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Confirmed</span>
                    <Link to={`/session/${String(b._id)}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors">
                      Join →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerUpcomingPage;
