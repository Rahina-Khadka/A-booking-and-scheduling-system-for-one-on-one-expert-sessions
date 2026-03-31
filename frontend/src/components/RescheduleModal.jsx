import { useState, useEffect } from 'react';
import bookingService from '../services/bookingService';

/**
 * RescheduleModal
 * Lets a user pick a new date/time slot for an existing booking.
 * Only shows slots that are available (not already booked).
 */
const RescheduleModal = ({ booking, onClose, onSuccess }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available slots whenever date changes
  useEffect(() => {
    if (!date) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setError('');
      try {
        const data = await bookingService.getAvailableSlots(
          booking.expertId._id,
          date,
          booking._id
        );
        setSlots(data.slots || []);
        if ((data.slots || []).length === 0) {
          setError('No available slots for this date.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load slots');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      await bookingService.rescheduleBooking(booking._id, {
        date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule booking');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reschedule Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Rescheduling session with <span className="font-medium">{booking.expertId?.name}</span>
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={today}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
              {loadingSlots ? (
                <p className="text-sm text-gray-500">Loading slots...</p>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                        selectedSlot?.startTime === slot.startTime
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {slot.startTime} – {slot.endTime}
                    </button>
                  ))}
                </div>
              ) : !error ? (
                <p className="text-sm text-gray-500">No available slots for this date.</p>
              ) : null}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSlot || submitting}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
