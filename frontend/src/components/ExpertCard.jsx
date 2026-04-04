import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AVATAR_BG = ['bg-stone-700','bg-accent-700','bg-stone-600','bg-stone-800','bg-accent-600'];

const ExpertCard = ({ expert, index = 0 }) => {
  const expertId = String(expert?._id || expert?.id || '').trim();
  if (!expertId || expertId === 'undefined' || expertId === 'null' || expertId === '[object Object]') return null;

  const bg = AVATAR_BG[index % AVATAR_BG.length];
  const initials = expert.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const stars = Math.round(expert.rating || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="card card-hover flex flex-col overflow-hidden"
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-11 h-11 rounded ${bg} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden`}>
            {expert.profilePicture
              ? <img src={expert.profilePicture} alt={expert.name} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-stone-900 text-sm truncate">{expert.name}</h3>
              {expert.verificationStatus === 'approved' && (
                <span className="text-xs font-medium text-accent-700 bg-accent-50 border border-accent-200 px-1.5 py-0.5 rounded flex-shrink-0">
                  ✓ Verified
                </span>
              )}
            </div>
            {expert.expertise?.[0] && (
              <p className="text-xs text-stone-500 mt-0.5 truncate">{expert.expertise[0]}</p>
            )}
          </div>
          <span className={`text-xs font-medium flex-shrink-0 ${expert.isOnline ? 'text-accent-600' : 'text-stone-400'}`}>
            {expert.isOnline ? '● Online' : '○ Offline'}
          </span>
        </div>

        {expert.bio && (
          <p className="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">{expert.bio}</p>
        )}

        {/* Skills */}
        {expert.expertise?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {expert.expertise.slice(0, 3).map((skill, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                {skill}
              </span>
            ))}
            {expert.expertise.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-400">+{expert.expertise.length - 3}</span>
            )}
          </div>
        )}

        {/* Rating + Price */}
        <div className="flex items-center justify-between mt-auto mb-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-sm ${s <= stars ? 'text-amber-500' : 'text-stone-200'}`}>★</span>
            ))}
            <span className="text-xs font-semibold text-stone-700 ml-1">{expert.rating?.toFixed(1) || '—'}</span>
            <span className="text-xs text-stone-400">({expert.totalRatings || 0})</span>
          </div>
          {expert.hourlyRate > 0 && (
            <span className="text-sm font-semibold text-stone-900">
              NPR {expert.hourlyRate}<span className="text-xs font-normal text-stone-400">/hr</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-stone-100">
          <Link to={`/experts/${expertId}`}
            className="flex-1 text-center text-xs font-medium py-2 rounded border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
            View Profile
          </Link>
          <Link to={`/book/${expertId}`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded bg-accent-600 text-white hover:bg-accent-700 transition-colors">
            Book Session
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ExpertCard;
