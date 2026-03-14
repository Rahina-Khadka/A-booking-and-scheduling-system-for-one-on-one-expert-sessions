import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import userService from '../services/userService';
import bookingService from '../services/bookingService';
import reviewService from '../services/reviewService';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SESSION_RATE = 20;

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
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl">×</button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const ExpertDashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name:'', phone:'', bio:'', expertise:[], profilePicture:'', hourlyRate:0, isOnline:false });
  const [availability, setAvailability] = useState(
    DAYS.map(day => ({ day, enabled: false, startTime: '09:00', endTime: '17:00' }))
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, b] = await Promise.all([userService.getProfile(), bookingService.getBookings()]);
      setProfile(p);
      setBookings(b);
      setForm({ name: p.name||'', phone: p.phone||'', bio: p.bio||'', expertise: p.expertise||[], profilePicture: p.profilePicture||'', hourlyRate: p.hourlyRate||0, isOnline: p.isOnline||false });
      setAvatarPreview(p.profilePicture || null);
      if (p.availability?.length > 0) {
        setAvailability(DAYS.map(day => {
          const s = p.availability.find(a => a.day === day);
          return s ? { day, enabled: true, startTime: s.slots?.[0]?.startTime||'09:00', endTime: s.slots?.[0]?.endTime||'17:00' } : { day, enabled: false, startTime:'09:00', endTime:'17:00' };
        }));
      }
      const r = await reviewService.getExpertReviews(p._id);
      setReviews(r);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await userService.updateProfile(form);
      setProfile(updated);
      setAvatarPreview(updated.profilePicture || null);
      setActiveModal(null);
    } catch(err) { alert(err.response?.data?.message || 'Save failed'); }
  };

  const handleScheduleSave = async () => {
    const avail = availability.filter(a => a.enabled).map(a => ({ day: a.day, slots: [{ startTime: a.startTime, endTime: a.endTime }] }));
    try {
      const updated = await userService.updateProfile({ ...form, availability: avail });
      setProfile(updated);
      setActiveModal(null);
    } catch(err) { alert('Failed to save schedule'); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await userService.fileToBase64(file);
    setAvatarPreview(b64);
    setForm(p => ({ ...p, profilePicture: b64 }));
  };

  const handleStatusChange = async (id, status) => {
    try { await bookingService.updateBookingStatus(id, status); load(); }
    catch(e) { alert('Failed to update status'); }
  };

  const toggleOnline = async () => {
    const newVal = !form.isOnline;
    setForm(p => ({ ...p, isOnline: newVal }));
    try { await userService.updateProfile({ ...form, isOnline: newVal }); }
    catch(e) { setForm(p => ({ ...p, isOnline: !newVal })); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');
  const earnings = completed.length * SESSION_RATE;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
              {profile?.profilePicture ? <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xl">{profile?.name?.charAt(0)}</span>}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expert Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {profile?.name?.split(' ')[0]}</p>
            </div>
          </div>
          {/* Online toggle */}
          <button onClick={toggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${form.isOnline ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            <span className={`w-2 h-2 rounded-full ${form.isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            {form.isOnline ? 'Online' : 'Go Online'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'⏳', label:'Pending Requests', value: pending.length, color:'bg-yellow-50 border-yellow-100 text-yellow-700' },
            { icon:'📅', label:'Upcoming Sessions', value: confirmed.length, color:'bg-green-50 border-green-100 text-green-700' },
            { icon:'✅', label:'Completed', value: completed.length, color:'bg-blue-50 border-blue-100 text-blue-700' },
            { icon:'💰', label:'Est. Earnings', value:`$${earnings}`, color:'bg-indigo-50 border-indigo-100 text-indigo-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-5 border ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'📋', label:'Session Requests', desc:`${pending.length} pending`, color:'bg-orange-500', action: () => setActiveModal('requests') },
            { icon:'📅', label:'Manage Availability', desc:'Set your schedule', color:'bg-green-500', action: () => setActiveModal('schedule') },
            { icon:'💰', label:'Earnings', desc:`$${earnings} total`, color:'bg-blue-500', action: () => setActiveModal('earnings') },
            { icon:'⭐', label:'Reviews', desc:`${reviews.length} reviews`, color:'bg-purple-500', action: () => setActiveModal('reviews') },
          ].map(c => (
            <button key={c.label} onClick={c.action}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white text-xl mb-3 group-hover:scale-110 transition-transform`}>
                {c.icon}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
            </button>
          ))}
        </div>

        {/* Bottom grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Sessions</h2>
              <Link to="/bookings" className="text-sm text-indigo-600 font-medium hover:underline">View All →</Link>
            </div>
            {confirmed.length > 0 ? (
              <div className="space-y-3">
                {confirmed.map(b => (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {b.userId?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{b.userId?.name}</p>
                        <p className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString()} · {b.startTime}</p>
                        {b.topic && <p className="text-xs text-gray-400">{b.topic}</p>}
                      </div>
                    </div>
                    <Link to={`/session/${b._id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">Join</Link>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">No upcoming sessions.</p>}
          </div>

          {/* Profile stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between"><span className="text-gray-400">Rating</span><span className="font-bold">{profile?.rating > 0 ? `${profile.rating.toFixed(1)} ⭐` : 'Not rated'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Reviews</span><span className="font-bold">{reviews.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Hourly Rate</span><span className="font-bold">${profile?.hourlyRate || 0}/hr</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span>
                <span className={`font-bold ${form.isOnline ? 'text-green-600' : 'text-gray-400'}`}>{form.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            {profile?.expertise?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {profile.expertise.map((s, i) => (
                  <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-100">{s}</span>
                ))}
              </div>
            )}
            <button onClick={() => setActiveModal('edit')}
              className="w-full bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>

        {/* Session Requests */}
        {activeModal === 'requests' && (
          <Modal title="Session Requests" onClose={() => setActiveModal(null)}>
            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map(b => (
                  <div key={b._id} className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{b.userId?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString()} · {b.startTime} – {b.endTime}</p>
                        {b.topic && <p className="text-xs text-gray-500 mt-1">Topic: {b.topic}</p>}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleStatusChange(b._id, 'confirmed')}
                        className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">Accept</button>
                      <button onClick={() => handleStatusChange(b._id, 'rejected')}
                        className="flex-1 py-2 rounded-xl bg-red-100 text-red-600 text-sm font-semibold hover:bg-red-200 transition-colors">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><p className="text-4xl mb-2">📋</p><p className="text-gray-400 text-sm">No pending requests.</p></div>}
          </Modal>
        )}

        {/* Manage Availability */}
        {activeModal === 'schedule' && (
          <Modal title="Manage Availability" onClose={() => setActiveModal(null)}>
            <p className="text-sm text-gray-500 mb-5">Toggle days and set your working hours.</p>
            <div className="space-y-3">
              {availability.map(a => (
                <div key={a.day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${a.enabled ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
                  <button type="button" onClick={() => setAvailability(prev => prev.map(x => x.day === a.day ? { ...x, enabled: !x.enabled } : x))}
                    className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${a.enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${a.enabled ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className={`w-24 text-sm font-medium ${a.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{a.day}</span>
                  {a.enabled && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="time" value={a.startTime} onChange={e => setAvailability(prev => prev.map(x => x.day === a.day ? { ...x, startTime: e.target.value } : x))}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400" />
                      <span className="text-gray-400 text-xs">to</span>
                      <input type="time" value={a.endTime} onChange={e => setAvailability(prev => prev.map(x => x.day === a.day ? { ...x, endTime: e.target.value } : x))}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleScheduleSave} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-colors">Save Schedule</button>
              <button onClick={() => setActiveModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </Modal>
        )}

        {/* Earnings */}
        {activeModal === 'earnings' && (
          <Modal title="Earnings Overview" onClose={() => setActiveModal(null)}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label:'Completed Sessions', value: completed.length, color:'bg-green-50 text-green-700 border-green-100' },
                { label:'Estimated Earnings', value:`$${earnings}`, color:'bg-indigo-50 text-indigo-700 border-indigo-100' },
                { label:'Upcoming', value: confirmed.length, color:'bg-blue-50 text-blue-700 border-blue-100' },
                { label:'Pending', value: pending.length, color:'bg-yellow-50 text-yellow-700 border-yellow-100' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                  <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Session History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bookings.map(b => (
                <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.userId?.name}</p>
                    <p className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString()} · {b.startTime}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
                    {b.status === 'completed' && <p className="text-xs text-green-600 font-semibold mt-1">+${SESSION_RATE}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {/* Reviews */}
        {activeModal === 'reviews' && (
          <Modal title="Reviews & Ratings" onClose={() => setActiveModal(null)}>
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-5">
              <div className="text-center">
                <p className="text-4xl font-bold text-indigo-600">{profile?.rating?.toFixed(1) || '—'}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= Math.round(profile?.rating||0) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}
                </div>
              </div>
              <div><p className="text-sm font-semibold text-gray-900">{reviews.length} total reviews</p></div>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {reviews.map(r => (
                  <div key={r._id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{r.userId?.name}</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}</div>
                    </div>
                    {r.review && <p className="text-sm text-gray-600">"{r.review}"</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><p className="text-4xl mb-2">⭐</p><p className="text-gray-400 text-sm">No reviews yet.</p></div>}
          </Modal>
        )}

        {/* Edit Profile */}
        {activeModal === 'edit' && (
          <Modal title="Edit Profile" onClose={() => setActiveModal(null)}>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col items-center gap-2 pb-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center cursor-pointer relative group shadow-md"
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
              {[{ label:'Name', name:'name', type:'text' }, { label:'Phone', name:'phone', type:'tel' }].map(f => (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Expertise (comma-separated)</label>
                <input type="text" value={form.expertise.join(', ')}
                  onChange={e => setForm(p => ({ ...p, expertise: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
                  placeholder="React, Node.js, MongoDB" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                <input type="number" min="0" value={form.hourlyRate}
                  onChange={e => setForm(p => ({ ...p, hourlyRate: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-500 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-600 transition-colors">Save Changes</button>
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </Modal>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ExpertDashboardPage;
