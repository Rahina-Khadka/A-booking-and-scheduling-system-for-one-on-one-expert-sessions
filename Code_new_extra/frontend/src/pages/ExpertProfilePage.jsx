import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import expertService from '../services/expertService';
import reviewService from '../services/reviewService';

const GRAD = ['from-indigo-400 to-purple-500','from-cyan-400 to-blue-500','from-green-400 to-teal-500','from-pink-400 to-rose-500','from-orange-400 to-amber-500'];

const Stars = ({ rating, size = 'sm' }) => {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${sz} ${s <= Math.round(rating || 0) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
};

const ExpertProfilePage = () => {
  const { id } = useParams();
  const [expert, setExpert] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    Promise.all([expertService.getExpertById(id), reviewService.getExpertReviews(id)])
      .then(([e, r]) => { setExpert(e); setReviews(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#F8FAFC]"><Navbar /><div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div></div>;
  if (!expert) return <div className="min-h-screen bg-[#F8FAFC]"><Navbar /><div className="max-w-4xl mx-auto px-4 pt-32 text-center"><h2 className="text-2xl font-bold text-gray-900 mb-3">Expert not found</h2><Link to="/experts" className="text-indigo-600 hover:underline">Back to Experts</Link></div></div>;

  const grad = GRAD[expert.name?.charCodeAt(0) % GRAD.length];
  const initials = expert.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'availability', label: 'Availability' },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className={`bg-gradient-to-r ${grad} pt-24 pb-20`} />
      <div className="max-w-5xl mx-auto px-4 -mt-16 pb-12">
        <Link to="/experts" className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium mb-4 relative z-10">← Back to Experts</Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden border-4 border-white flex-shrink-0`}>
              {expert.profilePicture ? <img src={expert.profilePicture} alt={expert.name} className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{expert.name}</h1>
                    {expert.verificationStatus === 'approved' && <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">✓ Verified Expert</span>}
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${expert.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${expert.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      {expert.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {expert.expertise?.[0] && <p className="text-indigo-600 font-medium text-sm mt-1">{expert.expertise[0]}</p>}
                </div>
                {expert.hourlyRate > 0 && <p className="text-2xl font-bold text-gray-900">NPR {expert.hourlyRate}<span className="text-sm font-normal text-gray-400">/hr</span></p>}
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <Stars rating={expert.rating} />
                <span className="text-sm font-bold text-gray-800">{expert.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-sm text-gray-400">({expert.totalRatings || 0} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {expert.expertise?.map((skill, i) => <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full border border-indigo-100 font-medium">{skill}</span>)}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link to={`/book/${expert._id}`} className="flex-1 text-center py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-sm hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-md">📅 Book a Session</Link>
            <button onClick={() => setActiveTab('availability')} className="flex-1 text-center py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors">🗓️ View Availability</button>
          </div>
        </motion.div>

        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 min-w-max px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.key ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-indigo-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'about' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            {expert.bio && <div><h3 className="text-base font-bold text-gray-900 mb-3">About</h3><p className="text-gray-600 leading-relaxed text-sm">{expert.bio}</p></div>}
            {expert.expertise?.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.expertise.map((skill, i) => <span key={i} className="bg-indigo-50 text-indigo-700 text-sm px-4 py-2 rounded-xl border border-indigo-100 font-medium">{skill}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="text-base font-bold text-gray-900 mb-5">Weekly Availability</h3>
            {expert.availability?.length > 0 ? (
              <div className="space-y-3">
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                  const sched = expert.availability.find(a => a.day === day);
                  return (
                    <div key={day} className={`flex items-center gap-4 p-4 rounded-2xl border ${sched ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sched ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`w-28 text-sm font-semibold ${sched ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                      {sched?.slots?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {sched.slots.map((slot, si) => <span key={si} className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-xl font-medium">{slot.startTime} – {slot.endTime}</span>)}
                        </div>
                      ) : <span className="text-xs text-gray-400">Not available</span>}
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-center py-10"><p className="text-4xl mb-3">📅</p><p className="text-gray-400 text-sm">No availability set yet.</p></div>}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">{r.userId?.name?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.userId?.name}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.review && <p className="text-sm text-gray-600 mt-3">"{r.review}"</p>}
              </div>
            )) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
                <p className="text-5xl mb-4">⭐</p>
                <p className="text-gray-500 text-sm">No reviews yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertProfilePage;
