import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import expertService from '../services/expertService';

const LearnerExpertsPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expertService.getRecommendedExperts()
      .then(setExperts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-stone-400 hover:text-accent-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">🎯</div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Experts Explored</h1>
            <p className="text-sm text-stone-500">{experts.length} recommended expert{experts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : experts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No experts explored yet</h3>
            <p className="text-sm text-stone-400 mb-6">Browse our expert directory to find the right mentor for you.</p>
            <Link to="/experts" className="px-6 py-2.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition-colors">
              Browse Experts
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {experts.map((e, i) => (
              <motion.div key={e._id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {e.profilePicture
                      ? <img src={e.profilePicture} alt="" className="w-full h-full object-cover" />
                      : e.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-stone-900 text-sm truncate">{e.name}</p>
                      {e.verificationStatus === 'approved' && (
                        <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-1.5 py-0.5 rounded-full font-semibold">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-accent-600 truncate">{e.expertise?.[0]}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-stone-900">{e.rating?.toFixed(1) || '—'} ⭐</p>
                    {e.hourlyRate > 0 && <p className="text-xs text-stone-400">${e.hourlyRate}/hr</p>}
                  </div>
                </div>
                {e.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {e.expertise.slice(0, 3).map((s, si) => (
                      <span key={si} className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-md border border-stone-200">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link to={`/experts/${e._id?.toString()}`}
                    className="flex-1 text-center text-xs font-medium py-2 rounded-xl border border-stone-200 text-stone-600 hover:border-accent-300 hover:text-accent-600 transition-colors">
                    View Profile
                  </Link>
                  <Link to={`/book/${e._id?.toString()}`}
                    className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition-all">
                    Book Session
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerExpertsPage;
