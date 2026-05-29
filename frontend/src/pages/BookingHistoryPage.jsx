import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import BookingCard from '../components/BookingCard';
import bookingService from '../services/bookingService';
import SessionReminderBanner from '../components/SessionReminderBanner';

/**
 * Booking History Page Component
 * Displays all bookings for the current user
 */
const BookingHistoryPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, status) => {
    try {
      const id = String(bookingId);
      await bookingService.updateBookingStatus(id, status);
      fetchBookings();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to update booking status';
      console.error('Status update error:', msg);
      alert(msg);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        // Refresh bookings
        fetchBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking');
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const isExpert = user?.role === 'expert';

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <SessionReminderBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">
          {isExpert ? 'My Sessions' : 'My Bookings'}
        </h1>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'expired', 'missed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === status
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-stone-700 border border-gray-300 hover:bg-stone-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-stone-600">Loading bookings...</div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusChange={handleStatusChange}
                onCancel={handleCancel}
                isExpert={isExpert}
                onRescheduled={fetchBookings}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-xl text-stone-600">No bookings found</p>
            <p className="text-stone-500 mt-2">
              {filter === 'all' 
                ? 'You haven\'t made any bookings yet' 
                : `No ${filter} bookings`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;
