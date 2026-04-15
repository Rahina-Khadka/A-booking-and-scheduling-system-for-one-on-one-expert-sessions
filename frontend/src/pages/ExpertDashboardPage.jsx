import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import SessionReminderBanner from '../components/SessionReminderBanner';
import userService from '../services/userService';
import bookingService from '../services/bookingService';
import reviewService from '../services/reviewService';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// 30-min slots from 00:00 to 23:00 (stop at 23:00 so +1hr end is always valid)
const TIME_SLOTS = Array.from({ length: 47 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const fmt = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const addOneHour = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-stone-100 text-stone-500 border border-stone-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-stone-200 sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold text-stone-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-stone-500 text-xl">×</button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const ExpertDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name:'', phone:'', bio:'', expertise:[], profilePicture:'', hourlyRate:0, isOnline:false, paymentQr:'', paymentName:'' });
  const [qrPreview, setQrPreview] = useState(null);
  const qrInputRef = useRef(null);
  const [availability, setAvailability] = useState(DAYS.map(day => ({ day, enabled: false, startTime: '09:00', endTime: '10:00' })));
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const p = await userService.getProfile();
      const [b, r] = await Promise.all([bookingService.getBookings(), reviewService.getExpertReviews(p._id).catch(() => [])]);
      setProfile(p); setBookings(b); setReviews(r);
      setForm({ name: p.name||'', phone: p.phone||'', bio: p.bio||'', expertise: p.expertise||[], profilePicture: p.profilePicture||'', hourlyRate: p.hourlyRate||0, isOnline: p.isOnline||false, paymentQr: p.paymentQr||'', paymentName: p.paymentName||'' });
      setAvatarPreview(p.profilePicture || null);
      setQrPreview(p.paymentQr || null);
      if (p.availability?.length > 0) {
        setAvailability(DAYS.map(day => {
          const s = p.availability.find(a => a.day === day);
          const start = s?.slots?.[0]?.startTime || '09:00';
          return s
            ? { day, enabled: true, startTime: start, endTime: addOneHour(start) }
            : { day, enabled: false, startTime: '09:00', endTime: '10:00' };
        }));
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    try { const updated = await userService.updateProfile(form); setProfile(updated); setAvatarPreview(updated.profilePicture || null); setActiveModal(null); }
    catch(err) { alert(err.response?.data?.message || 'Save failed'); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return; }
    if (pwForm.next.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    try {
      await userService.changePassword(pwForm.current, pwForm.next);
      setPwSuccess('Password changed successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) { setPwError(err.response?.data?.message || 'Failed to change password'); }
  };

  const handleScheduleSave = async () => {
    // Validate: end time must be after start time
    const invalid = availability.filter(a => a.enabled && a.endTime <= a.startTime);
    if (invalid.length > 0) {
      alert(`Invalid time range for: ${invalid.map(a => a.day).join(', ')}. End time must be after start time.`);
      return;
    }
    const avail = availability.filter(a => a.enabled).map(a => ({ day: a.day, slots: [{ startTime: a.startTime, endTime: a.endTime }] }));
    try {
      // Only send availability — avoid sending large base64 fields
      const updated = await userService.updateProfile({ availability: avail });
      setProfile(updated);
      setActiveModal(null);
    } catch(err) {
      alert(err.response?.data?.message || err.message || 'Failed to save schedule');
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await userService.fileToBase64(file);
    setAvatarPreview(b64);
    setForm(p => ({ ...p, profilePicture: b64 }));
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await userService.fileToBase64(file);
    setQrPreview(b64);
    setForm(p => ({ ...p, paymentQr: b64 }));
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

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');
  const earnings = completed.length * (profile?.hourlyRate || 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <SessionReminderBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {profile?.verificationStatus !== 'approved' && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 flex items-start gap-3 ${profile?.verificationStatus === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <span className="text-2xl">{profile?.verificationStatus === 'rejected' ? '❌' : '⏳'}</span>
            <div>
              <p className={`font-semibold text-sm ${profile?.verificationStatus === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`}>
                {profile?.verificationStatus === 'rejected' ? 'Verification Rejected' : 'Pending Verification'}
              </p>
              <p className={`text-xs mt-0.5 ${profile?.verificationStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                {profile?.verificationStatus === 'rejected' ? 'Your verification was rejected. Please contact support.' : 'Your account is under review. You will be visible once approved.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
              {profile?.profilePicture ? <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{profile?.name?.charAt(0)}</span>}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Expert Dashboard</h1>
              <p className="text-sm text-stone-500">Welcome, {profile?.name?.split(' ')[0]}</p>
            </div>
          </div>
          <button onClick={toggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${form.isOnline ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-stone-600 hover:bg-gray-300'}`}>
            <span className={`w-2 h-2 rounded-full ${form.isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            {form.isOnline ? 'Online' : 'Go Online'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'⏳', label:'Pending Requests',   value: pending.length,   color:'bg-yellow-50 border-yellow-100 text-yellow-700', route:'/expert/requests' },
            { icon:'📅', label:'Upcoming Sessions',  value: confirmed.length, color:'bg-green-50 border-green-100 text-green-700',   route:'/expert/sessions' },
            { icon:'✅', label:'Completed',           value: completed.length, color:'bg-blue-50 border-blue-100 text-blue-700',     route:'/expert/completed' },
            { icon:'💰', label:'Est. Earnings (NPR)', value: earnings,         color:'bg-accent-50 border-accent-100 text-accent-700', route:'/expert/earnings' },
          ].map(s => (
            <div
              key={s.label}
              role="button"
              tabIndex={0}
              onClick={() => navigate(s.route)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(s.route)}
              className={`rounded-2xl p-5 border cursor-pointer select-none transition-all duration-150 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] ${s.color}`}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon:'📋', label:'Session Requests', desc:`${pending.length} pending`, color:'bg-orange-500', action: () => setActiveModal('requests') },
            { icon:'📅', label:'Manage Availability', desc:'Set your schedule', color:'bg-green-500', action: () => setActiveModal('schedule') },
            { icon:'⭐', label:'Reviews', desc:`${reviews.length} reviews`, color:'bg-purple-500', action: () => setActiveModal('reviews') },
          ].map(c => (
            <button key={c.label} onClick={c.action}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 text-left hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white text-xl mb-3 group-hover:scale-110 transition-transform`}>{c.icon}</div>
              <p className="font-semibold text-stone-900 text-sm">{c.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{c.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-stone-900">Upcoming Sessions</h2>
              <Link to="/bookings" className="text-sm text-accent-600 font-medium hover:underline">View All →</Link>
            </div>
            {confirmed.length > 0 ? (
              <div className="space-y-3">
                {confirmed.map(b => (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{b.userId?.name?.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{b.userId?.name}</p>
                        <p className="text-xs text-stone-400">{new Date(b.date).toLocaleDateString()} · {b.startTime}</p>
                      </div>
                    </div>
                    <Link to={`/session/${b._id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">Join</Link>
                  </div>
                ))}
              </div>
            ) : <p className="text-stone-400 text-sm">No upcoming sessions.</p>}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-stone-900">Profile</h2>
              <button
                onClick={() => setActiveModal('edit')}
                className="flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 bg-accent-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                ✏️ Edit
              </button>
            </div>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between"><span className="text-stone-400">Rating</span><span className="font-bold">{profile?.rating > 0 ? `${profile.rating.toFixed(1)} ⭐` : 'Not rated'}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Reviews</span><span className="font-bold">{reviews.length}</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Hourly Rate</span><span className="font-bold">NPR {profile?.hourlyRate || 0}/hr</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Status</span><span className={`font-bold ${form.isOnline ? 'text-green-600' : 'text-stone-400'}`}>{form.isOnline ? 'Online' : 'Offline'}</span></div>
            </div>
            {profile?.expertise?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.expertise.map((s, i) => <span key={i} className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-md border border-stone-200">{s}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal === 'requests' && (
          <Modal title="Session Requests" onClose={() => setActiveModal(null)}>
            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map(b => (
                  <div key={b._id} className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-stone-900">{b.userId?.name}</p>
                        <p className="text-xs text-stone-500">{new Date(b.date).toLocaleDateString()} · {b.startTime} – {b.endTime}</p>
                        {b.topic && <p className="text-xs text-stone-500 mt-1">Topic: {b.topic}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleStatusChange(b._id, 'confirmed')} className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600">Accept</button>
                      <button onClick={() => handleStatusChange(b._id, 'rejected')} className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-200">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><p className="text-4xl mb-2">📋</p><p className="text-stone-400 text-sm">No pending requests.</p></div>}
          </Modal>
        )}

        {activeModal === 'schedule' && (
          <Modal title="Manage Availability" onClose={() => setActiveModal(null)}>
            <div className="space-y-3">
              {availability.map(a => (
                <div key={a.day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${a.enabled ? 'border-accent-200 bg-accent-50' : 'border-stone-200 bg-stone-50'}`}>
                  <button type="button" onClick={() => setAvailability(prev => prev.map(x => x.day === a.day ? { ...x, enabled: !x.enabled } : x))}
                    className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${a.enabled ? 'bg-accent-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${a.enabled ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className={`w-24 text-sm font-medium ${a.enabled ? 'text-stone-900' : 'text-stone-400'}`}>{a.day}</span>
                  {a.enabled && (
                    <div className="flex items-center gap-2 ml-auto">
                      <select
                        value={a.startTime}
                        onChange={e => {
                          const newStart = e.target.value;
                          setAvailability(prev => prev.map(x =>
                            x.day === a.day ? { ...x, startTime: newStart, endTime: addOneHour(newStart) } : x
                          ));
                        }}
                        className="text-sm border border-stone-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                      >
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                      </select>
                      <span className="text-stone-400 text-xs">to</span>
                      <span className="text-sm font-medium text-stone-700 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1">
                        {fmt(a.endTime)}
                      </span>
                      <span className="text-xs text-stone-400">(1 hr)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleScheduleSave} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600">Save Schedule</button>
              <button onClick={() => setActiveModal(null)} className="flex-1 bg-gray-100 text-stone-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200">Cancel</button>
            </div>
          </Modal>
        )}

        {activeModal === 'reviews' && (
          <Modal title="Reviews & Ratings" onClose={() => setActiveModal(null)}>
            {reviews.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {reviews.map(r => (
                  <div key={r._id} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone-900">{r.userId?.name}</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}</div>
                    </div>
                    {r.review && <p className="text-sm text-stone-600">"{r.review}"</p>}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><p className="text-4xl mb-2">⭐</p><p className="text-stone-400 text-sm">No reviews yet.</p></div>}
          </Modal>
        )}

        {activeModal === 'edit' && (
          <Modal title="Edit Profile" onClose={() => setActiveModal(null)}>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col items-center gap-2 pb-4 border-b border-stone-200">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center cursor-pointer relative group shadow-md"
                  onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-2xl">{form.name?.charAt(0)}</span>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"><span className="text-white text-xs">Change</span></div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              </div>
              {[{ label:'Name', name:'name', type:'text' }].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-stone-700 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                <input
                  type="text" inputMode="numeric" maxLength={10}
                  value={form.phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm(p => ({ ...p, phone: digits }));
                  }}
                  placeholder="10-digit number"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm"
                />
                {form.phone && form.phone.length !== 10 && (
                  <p className="text-xs text-red-500 mt-1">Phone must be exactly 10 digits</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows="3"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Expertise (comma-separated)</label>
                <input type="text" value={form.expertise.join(', ')}
                  onChange={e => setForm(p => ({ ...p, expertise: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
              </div>

              {/* ── Payment Settings ── */}
              <div className="border-t border-stone-200 pt-4">
                <p className="text-sm font-bold text-stone-800 mb-3">💰 Payment Settings</p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Hourly Rate (NPR)</label>
                  <p className="text-xs text-stone-400 mb-1.5">This is what learners will be charged per session.</p>
                  <input type="number" min="0" value={form.hourlyRate}
                    onChange={e => setForm(p => ({ ...p, hourlyRate: Number(e.target.value) }))}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Payment Name / ID</label>
                  <p className="text-xs text-stone-400 mb-1.5">Your eSewa ID or Khalti name shown to learners when they pay.</p>
                  <input type="text" value={form.paymentName}
                    onChange={e => setForm(p => ({ ...p, paymentName: e.target.value }))}
                    placeholder="e.g. 9800000000 or Your Name"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Payment QR / Scan Photo</label>
                  <p className="text-xs text-stone-400 mb-2">Upload your eSewa or Khalti QR code. Learners will scan this to pay you after sessions.</p>
                  <div
                    onClick={() => qrInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${qrPreview ? 'border-blue-400 bg-blue-50' : 'border-stone-200 hover:border-blue-300'}`}
                  >
                    {qrPreview ? (
                      <div>
                        <img src={qrPreview} alt="Payment QR" className="max-h-40 mx-auto rounded-lg object-contain" />
                        <p className="text-xs text-blue-600 mt-2 font-medium">✓ QR uploaded — click to change</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl mb-1">📷</p>
                        <p className="text-sm text-stone-500">Click to upload your QR code</p>
                        <p className="text-xs text-stone-400 mt-0.5">JPG, PNG accepted</p>
                      </div>
                    )}
                  </div>
                  <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                  {qrPreview && (
                    <button type="button"
                      onClick={() => { setQrPreview(null); setForm(p => ({ ...p, paymentQr: '' })); }}
                      className="text-xs text-red-500 hover:underline mt-1.5 block">
                      Remove QR photo
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent-600 text-white hover:bg-accent-700">Save Changes</button>
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-gray-100 text-stone-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200">Cancel</button>
              </div>
            </form>

            {/* Change Password */}
            <div className="border-t border-stone-200 mt-6 pt-6">
              <h3 className="text-sm font-bold text-stone-800 mb-4">Change Password</h3>
              {pwError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-3">{pwError}</div>}
              {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm mb-3">{pwSuccess}</div>}
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Current Password</label>
                  <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">New Password</label>
                  <input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Confirm New Password</label>
                  <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm" />
                </div>
                <button type="submit" className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-700 transition-colors">
                  Update Password
                </button>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpertDashboardPage;
