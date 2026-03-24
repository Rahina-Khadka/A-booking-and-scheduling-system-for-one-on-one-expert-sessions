import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getStatusColor } from '../utils/formatDate';
import ReviewModal from './ReviewModal';

/**
 * Booking Card Component
 * Displays booking information with actions
 */
const BookingCard = ({ booking, onStatusChange, onCancel, isExpert, onReviewSubmitted }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const expert = booking.expertId;
  const user = booking.userId;

  // Check if session is confirmed
  const canJoinSession = booking.status === 'confirmed';
  const canReview = !isExpert && booking.status === 'completed';

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isExpert ? `Session with ${user?.name}` : `Session with ${expert?.name}`}
            </h3>
            <p className="text-gray-600 text-sm">
              {isExpert ? user?.email : expert?.email}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p><span className="font-medium">Date:</span> {formatDate(booking.date)}</p>
          <p><span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}</p>
          {booking.topic && <p><span className="font-medium">Topic:</span> {booking.topic}</p>}
          {booking.notes && <p><span className="font-medium">Notes:</span> {booking.notes}</p>}
        </div>

        {/* Action buttons based on status and role */}
        <div className="mt-4 flex gap-3">
          {/* Join Session Button */}
          {canJoinSession && (
            <Link
              to={`/session/${booking._id}`}
              className="flex-1 bg-green-500 text-white text-center px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Join Session
            </Link>
          )}

          {/* Review Button */}
          {canReview && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              Leave Review
            </button>
          )}

          {isExpert && booking.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusChange(booking._id, 'confirmed')}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={() => onStatusChange(booking._id, 'rejected')}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}

          {!isExpert && booking.status === 'pending' && (
            <button
              onClick={() => onCancel(booking._id)}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cancel Booking
            </button>
          )}

          {booking.status === 'confirmed' && isExpert && (
            <button
              onClick={() => onStatusChange(booking._id, 'completed')}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          booking={booking}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            if (onReviewSubmitted) onReviewSubmitted();
          }}
        />
      )}
    </>
  );
};

export default BookingCard;
