import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GRAD = ['from-indigo-400 to-purple-500','from-cyan-400 to-blue-500','from-green-400 to-teal-500','from-pink-400 to-rose-500','from-orange-400 to-amber-500'];

const ExpertCard = ({ expert, index = 0 }) => {
  const grad = GRAD[index % GRAD.length];
  const initials = expert.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const stars = Math.round(expert.rating || 0);

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }} whileHover={{ y: -6 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className={`h-16 bg-gradient-to-r ${grad} relative`}>
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${expert.isOnline ? 'bg-green-500/90 text-white' : 'bg-gray-500/70 text-white'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${expert.isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
          {expert.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
      <div className="px-5 pb-5 flex flex-col flex-1">
        <div className="flex items-end gap-3 -mt-8 mb-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white flex-shrink-0 overflow-hidden`}>
            {expert.profilePicture ? <img src={expert.profilePicture} alt={expert.name} className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="pb-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base truncate">{expert.name}</h3>
              {expert.verificationStatus === 'approved' && (
                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">✓ Verified</span>
              )}
            </div>
            {expert.expertise?.[0] && <p className="text-xs text-indigo-600 font-medium truncate">{expert.expertise[0]}</p>}
          </div>
        </div>
        {expert.bio && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{expert.bio}</p>}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {expert.expertise?.slice(0, 3).map((skill, i) => (
            <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-100">{skill}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= stars ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}
            <span className="text-xs font-bold text-gray-700 ml-1">{expert.rating?.toFixed(1) || '0.0'}</span>
          </div>
          {expert.hourlyRate > 0 && <span className="text-base font-bold text-gray-900">NPR {expert.hourlyRate}<span className="text-xs font-normal text-gray-400">/hr</span></span>}
        </div>
        <div className="mt-auto flex gap-2">
          <Link to={`/experts/${expert._id}`} className="flex-1 text-center text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">View Profile</Link>
          <Link to={`/book/${expert._id}`} className="flex-1 text-center text-sm font-semibold px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-sm">Book Session</Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ExpertCard;
