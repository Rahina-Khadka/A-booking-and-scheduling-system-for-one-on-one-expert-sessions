import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import ExpertCard from '../components/ExpertCard';
import expertService from '../services/expertService';

const POPULAR_SKILLS = [
  'Web Development', 'Data Science', 'UI/UX Design', 'Cloud Computing',
  'Machine Learning', 'Mobile Development', 'DevOps', 'Cybersecurity',
  'Blockchain', 'Product Management',
];

const ExpertListPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [activeSkill, setActiveSkill] = useState('');

  const allExpertise = [...new Set(experts.flatMap(e => e.expertise || []))];

  useEffect(() => { fetchExperts(); }, [showRecommended]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const data = showRecommended
        ? await expertService.getRecommendedExperts()
        : await expertService.getExperts();
      setExperts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = experts.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.expertise?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRating = filterRating === 0 || (e.rating || 0) >= filterRating;
    const matchSkill = !activeSkill || e.expertise?.includes(activeSkill);
    return matchSearch && matchRating && matchSkill;
  });

  const clearFilters = () => { setSearchTerm(''); setFilterRating(0); setActiveSkill(''); };
  const hasFilters = searchTerm || filterRating > 0 || activeSkill;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Find Your Expert Mentor</h1>
            <p className="text-white/70 text-sm mb-6">Browse verified professionals ready to help you grow</p>

            {/* Search bar */}
            <div className="flex gap-3 max-w-2xl">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 shadow-lg text-sm outline-none focus:ring-2 focus:ring-white/50 bg-white"
                />
              </div>
              <button
                onClick={() => setShowRecommended(!showRecommended)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all whitespace-nowrap ${
                  showRecommended ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {showRecommended ? '✨ Recommended' : 'Show Recommended'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Skill chips */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Filter by Skill</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSkill('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                !activeSkill ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              All
            </button>
            {[...new Set([...POPULAR_SKILLS, ...allExpertise])].slice(0, 14).map(skill => (
              <button
                key={skill}
                onClick={() => setActiveSkill(activeSkill === skill ? '' : skill)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeSkill === skill ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Rating filter + results count */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${filtered.length} expert${filtered.length !== 1 ? 's' : ''} found`}
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline font-medium">
                Clear filters ×
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Min rating:</span>
            <div className="flex gap-1">
              {[0, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRating(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    filterRating === r ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {r === 0 ? 'Any' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {searchTerm && (
              <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-100 font-medium">
                🔍 "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-indigo-900">×</button>
              </span>
            )}
            {activeSkill && (
              <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-100 font-medium">
                🏷️ {activeSkill}
                <button onClick={() => setActiveSkill('')} className="hover:text-indigo-900">×</button>
              </span>
            )}
            {filterRating > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full border border-amber-100 font-medium">
                ⭐ {filterRating}+ stars
                <button onClick={() => setFilterRating(0)} className="hover:text-amber-900">×</button>
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse">
                <div className="h-16 bg-gray-100 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-gray-100 rounded-full w-16" />
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((expert, i) => (
              <ExpertCard key={expert._id} expert={expert} index={i} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl font-semibold text-gray-700 mb-2">No experts found</p>
            <p className="text-gray-400 text-sm mb-5">Try adjusting your filters or search term</p>
            <button onClick={clearFilters} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertListPage;
