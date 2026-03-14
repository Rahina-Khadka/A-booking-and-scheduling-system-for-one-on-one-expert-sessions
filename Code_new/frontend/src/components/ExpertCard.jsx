import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GRAD = [
  'from-indigo-400 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-green-400 to-teal-500',
  'from-pink-400 to-rose-500',
  'from-orange-400 to-amber-500',
];

const ExpertCard = ({ expert, index = 0 }) => {
  const grad = GRAD[index % GRAD.length];
  const initials = expert.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const stars = Math.round(expert.rating || 0);
  const isOnline = expert.isOnline ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.15)' }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-200"
    >
      {/* Card header — gradient banner */}
      <div className={`h-16 bg-gradient-to-r ${grad} relative`}>
        {/* Online indicator */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isOnline ? 'bg-green-500/90 text-white' : 'bg-gray-500/70 text-white'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="px-5 pb-5 flex flex-col flex-1">
        {/* Avatar — overlaps banner */}
        <div className="flex items-end gap-3 -mt-8 mb-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white flex-shrink-0 overflow-hidden`}>
            {expert.profilePicture
              ? <img src={expert.profilePicture} alt={expert.name} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="pb-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{expert.name}</h3>
            {expert.expertise?.[0] && (
              <p className="text-xs text-indigo-600 font-medium truncate">{expert.expertise[0]}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {expert.bio && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{expert.bio}</p>
        )}

        {/* Expertise tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {expert.expertise?.slice(0, 3).map((skill, i) => (
            <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium border border-indigo-100">
              {skill}
            </span>
          ))}
          {expert.expertise?.length > 3 && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
              +{expert.expertise.length - 3}
            </span>
          )}
        </div>

        {/* Rating + Price row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-3.5 h-3.5 ${s <= stars ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
            <span className="text-xs font-bold text-gray-700 ml-1">{expert.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-gray-400">({expert.totalRatings || 0})</span>
          </div>
          {expert.hourlyRate > 0 && (
            <div className="text-right">
              <span className="text-base font-bold text-gray-900">${expert.hourlyRate}</span>
              <span className="text-xs text-gray-400">/hr</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Link to={`/experts/${expert._id}`}
            className="flex-1 text-center text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            View Profile
          </Link>
          <Link to={`/book/${expert._id}`}
            className="flex-1 text-center text-sm font-semibold px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-sm hover:shadow-md">
            Book Session
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ExpertCard;
