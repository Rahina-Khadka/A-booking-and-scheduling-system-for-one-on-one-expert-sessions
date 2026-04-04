import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import expertService from '../services/expertService';
import bookingService from '../services/bookingService';

// Convert "HH:MM" to total minutes
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// Convert total minutes back to "HH:MM"
const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;

// Format "HH:MM" to "12:34 PM" for display
const fmt12 = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
};

// Returns null if valid, or an error string
const validateSessionTime = (start, end) => {
  if (!start || !end) return null;
  const diff = toMin(end) - toMin(start);
  if (diff <= 0) return 'End time must be after start time';
  if (diff > 60) return 'Session cannot exceed 1 hour';
  return null;
};

const BookingPage = () => {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ date: '', startTime: '', endTime: '', topic: '', notes: '' });

  useEffect(() => {
    // Validate it looks like a MongoDB ObjectId (24 hex chars)
    if (!expertId || !/^[a-f\d]{24}$/i.test(expertId)) {
      setError(`Invalid expert ID: "${expertId}". Please go back and try again.`);
      setLoading(false);
      return;
    }
    expertService.getExpertById(expertId)
      .then(setExpert)
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load expert';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [expertId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'startTime' && value) {
        const startMin = toMin(value);
        if (prev.endTime) {
          const diff = toMin(prev.endTime) - startMin;
          // Clear end if it's now invalid
          if (diff <= 0 || diff > 60) updated.endTime = '';
        }
      }

      if (name === 'endTime' && value && prev.startTime) {
        const diff = toMin(value) - toMin(prev.startTime);
        if (diff <= 0) {
          // End is before or equal to start — clear it so user must pick again
          updated.endTime = '';
        } else if (diff > 60) {
          // Auto-clamp to exactly start + 60 min
          updated.endTime = fromMin(toMin(prev.startTime) + 60);
        }
      }

      return updated;
    });
  };

  const timeError = validateSessionTime(formData.startTime, formData.endTime);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await bookingService.createBooking({ expertId, ...formData });
      setSuccess(true);
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-stone-50"><Navbar /><div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin" /></div></div>;

  if (error && !expert) return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <Link to="/experts" className="text-accent-600 hover:underline mb-6 inline-block">← Back to Experts</Link>
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Could not load expert</h2>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <Link to="/experts" className="px-6 py-2.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition-colors">
            Browse Experts
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <Link to={`/experts/${expertId}`} className="text-accent-600 hover:underline mb-6 inline-block">← Back to Expert Profile</Link>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Book a Session</h1>
          <p className="text-stone-600 mb-6">with {expert?.name}</p>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">Booking created! Redirecting...</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Start Time</label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">End Time</label>
                {formData.startTime ? (
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 outline-none bg-white ${timeError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select end time</option>
                    {Array.from({ length: 60 }, (_, i) => {
                      const endMin = toMin(formData.startTime) + i + 1;
                      if (endMin > 23 * 60 + 59) return null;
                      const val = fromMin(endMin);
                      return <option key={val} value={val}>{fmt12(val)} ({i + 1} min)</option>;
                    })}
                  </select>
                ) : (
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required disabled
                    placeholder="Select start time first"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-stone-50 text-stone-400 cursor-not-allowed outline-none" />
                )}
              </div>
              {timeError && (
                <p className="col-span-2 text-xs text-red-600 -mt-2">{timeError}</p>
              )}
              {!timeError && formData.startTime && formData.endTime && (
                <p className="col-span-2 text-xs text-stone-400 -mt-2">
                  {fmt12(formData.startTime)} → {fmt12(formData.endTime)} · {toMin(formData.endTime) - toMin(formData.startTime)} min
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Topic (Optional)</label>
              <input type="text" name="topic" value={formData.topic} onChange={handleChange} placeholder="What would you like to discuss?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Notes (Optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 outline-none" />
            </div>
            <button type="submit" disabled={submitting || success || !!timeError}
              className="w-full bg-accent-600 text-white hover:bg-accent-700 disabled:bg-gray-400">
              {submitting ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
