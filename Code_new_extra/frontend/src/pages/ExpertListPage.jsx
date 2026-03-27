import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import ExpertCard from '../components/ExpertCard';
import expertService from '../services/expertService';

const ExpertListPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [activeSkill, setActiveSkill] = useState('');

  useEffect(() => {
    expertService.getExperts().then(setExperts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const allSkills = [...new Set(experts.flatMap(e => e.expertise || []))];

  const filtered = experts.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.expertise?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRating = filterRating === 0 || (e.rating || 0) >= filterRating;
    const matchSkill = !activeSkill || e.expertise?.includes(activeSkill);
    return matchSearch && matchRating && matchSkill;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Find Your Expert Mentor</h1>
          <p className="text-white/70 text-sm mb-6">Browse verified professionals ready to help you grow</p>
          <div className="relative max-w-2xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Search by name or skill..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 shadow-lg text-sm outline-none bg-white" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {allSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveSkill('')} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${!activeSkill ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>All</button>
            {allSkills.slice(0, 12).map(skill => (
              <button key={skill} onClick={() => setActiveSkill(activeSkill === skill ? '' : skill)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeSkill === skill ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>{skill}</button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500">{filtered.length} expert{filtered.length !== 1 ? 's' : ''} found</span>
          <div className="flex gap-1 ml-auto">
            {[0,3,4,5].map(r => (
              <button key={r} onClick={() => setFilterRating(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterRating === r ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-600 border-gray-200'}`}>
                {r === 0 ? 'Any' : `${r}★+`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((expert, i) => <ExpertCard key={expert._id} expert={expert} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl font-semibold text-gray-700 mb-2">No experts found</p>
            <button onClick={() => { setSearchTerm(''); setFilterRating(0); setActiveSkill(''); }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertListPage;
