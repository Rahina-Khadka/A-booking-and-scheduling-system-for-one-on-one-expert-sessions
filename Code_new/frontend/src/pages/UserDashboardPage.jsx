import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import ExpertCard from '../components/ExpertCard';
import userService from '../services/userService';
import expertService from '../services/expertService';
import bookingService from '../services/bookingService';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl">×</button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className={`rounded-2xl p-5 border ${color}`}>
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs font-medium opacity-70 mt-0.5">{label}</div>
  </div>
);

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: '', phone: '', bio: '', interests: [], profilePicture: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, b, r] = await Promise.all([
        userService.getProfile(),
        bookingService.getBookings(),
        expertService.getRecommendedExperts(),
      ]);
      setProfile(p);
      setBookings(b);
      setRecommended(r.slice(0, 3));
      setForm({ name: p.name || '', phone: p.phone || '', bio: p.bio || '', interests: p.interests || [], profilePicture: p.profilePicture || '' });
      setAvatarPreview(p.profilePicture || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await userService.updateProfile(form);
      setProfile(updated);
      setAvatarPreview(updated.profilePicture || null);
      setEditOpen(false);
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await userService.fileToBase64(file);
    setAvatarPreview(b64);
    setForm(p => ({ ...p, profilePicture: b64 }));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  const completed = bookings.filter(b => b.status === 'completed').length;
  const upcoming = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center shadow-md flex-shrink-0">
              {profile?.profilePicture
                ? <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xl">{profile?.name?.charAt(0)}</span>}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.name?.split(' ')[0]} 👋</h1>
              <p className="text-sm text-gray-500">Learner Dashboard</p>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors bg-white shadow-sm">
            ✏️ Edit Profile
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="✅" label="Completed Sessions" value={completed} color="bg-blue-50 border-blue-100 text-blue-700" />
          <StatCard icon="📅" label="Upcoming Sessions" value={upcoming} color="bg-green-50 border-green-100 text-green-700" />
          <StatCard icon="⏳" label="Pending Requests" value={pending} color="bg-yellow-50 border-yellow-100 text-yellow-700" />
          <StatCard icon="🎯" label="Experts Explored" value={recommended.length} color="bg-indigo-50 border-indigo-100 text-indigo-700" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-900">My Bookings</h2>
                <Link to="/bookings" className="text-sm text-indigo-600 font-medium hover:underline">View All →</Link>
              </div>
              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {b.expertId?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{b.expertId?.name}</p>
                          <p className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString()} · {b.startTime}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">📅</p>
                  <p className="text-gray-500 text-sm">No bookings yet.</p>
                  <Link to="/experts" className="mt-3 inline-block text-sm text-indigo-600 font-medium hover:underline">Find an Expert →</Link>
                </div>
              )}
            </div>

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">My Profile</h2>
                <button onClick={() => setEditOpen(true)} className="text-sm text-indigo-600 font-medium hover:underline">Edit</button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Name', value: profile?.name },
                  { label: 'Email', value: profile?.email },
                  { label: 'Phone', value: profile?.phone || '—' },
                  { label: 'Bio', value: profile?.bio || '—' },
                ].map(f => (
                  <div key={f.label} className="flex gap-3">
                    <span className="w-16 text-gray-400 flex-shrink-0">{f.label}</span>
                    <span className="text-gray-800 font-medium">{f.value}</span>
                  </div>
                ))}
                {profile?.interests?.length > 0 && (
                  <div className="flex gap-3">
                    <span className="w-16 text-gray-400 flex-shrink-0">Interests</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((i, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-100">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                <Link to="/experts" className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">
                  <span>🔍</span> Find Experts
                </Link>
                <Link to="/bookings" className="flex items-center gap-3 p-3 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors text-sm font-medium">
                  <span>📋</span> My Bookings
                </Link>
              </div>
            </div>

            {/* Recommended */}
            {recommended.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900">🤖 Recommended</h3>
                  <Link to="/experts" className="text-xs text-indigo-600 hover:underline">See all</Link>
                </div>
                <div className="space-y-3">
                  {recommended.map((e, i) => (
                    <div key={e._id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {e.profilePicture ? <img src={e.profilePicture} alt="" className="w-full h-full object-cover" /> : e.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{e.name}</p>
                        <p className="text-xs text-gray-400 truncate">{e.expertise?.slice(0, 2).join(', ')}</p>
                      </div>
                      <Link to={`/experts/${e._id}`} className="text-xs text-indigo-600 hover:underline flex-shrink-0">View</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editOpen && (
          <Modal title="Edit Profile" onClose={() => setEditOpen(false)}>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col items-center gap-2 pb-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center cursor-pointer relative group shadow-md"
                  onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-2xl">{form.name?.charAt(0)}</span>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <span className="text-white text-xs">Change</span>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-indigo-600 hover:underline">Upload Photo</button>
              </div>
              {[{ label: 'Name', name: 'name', type: 'text' }, { label: 'Phone', name: 'phone', type: 'tel' }].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows="3"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
                <input type="text" value={form.interests.join(', ')}
                  onChange={e => setForm(p => ({ ...p, interests: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
                  placeholder="Web Dev, AI, Design" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-500 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-600 transition-colors">Save Changes</button>
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboardPage;
