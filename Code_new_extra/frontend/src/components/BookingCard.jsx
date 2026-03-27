import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getStatusColor } from '../utils/formatDate';
import ReviewModal from './ReviewModal';
import RescheduleModal from './RescheduleModal';
import PaymentModal from './PaymentModal';
import CancelRefundModal from './CancelRefundModal';
import invoiceService from '../services/invoiceService';

/**
 * Booking Card Component
 * Displays booking information with actions
 */
const BookingCard = ({ booking, onStatusChange, onCancel, isExpert, onReviewSubmitted, onRescheduled }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const expert = booking.expertId;
  const user = booking.userId;

  const canJoinSession = booking.status === 'confirmed';
  const canReview = !isExpert && booking.status === 'completed';
  const canPay = !isExpert && ['pending', 'confirmed'].includes(booking.status) && booking.payment?.status !== 'paid';
  const canDownloadInvoice = !isExpert && booking.payment?.status === 'paid';
  // Users can reschedule pending or confirmed bookings (not experts)
  const canReschedule = !isExpert && ['pending', 'confirmed'].includes(booking.status);

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
          {/* Payment status badge */}
          {!isExpert && booking.payment && (
            <p>
              <span className="font-medium">Payment:</span>{' '}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                booking.payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                booking.payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                booking.payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {booking.payment.status}
              </span>
            </p>
          )}
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
              onClick={() => setShowCancelModal(true)}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cancel Booking
            </button>
          )}

          {canPay && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Pay Now
            </button>
          )}

          {canDownloadInvoice && (
            <button
              onClick={() => invoiceService.downloadInvoice(booking._id)}
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              📄 Invoice
            </button>
          )}

          {canReschedule && (
            <button
              onClick={() => setShowRescheduleModal(true)}
              className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
            >
              Reschedule
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

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <RescheduleModal
          booking={booking}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={() => {
            if (onRescheduled) onRescheduled();
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          booking={booking}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => setShowPaymentModal(false)}
        />
      )}

      {/* Cancel + Refund Modal */}
      {showCancelModal && (
        <CancelRefundModal
          booking={booking}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => { if (onRescheduled) onRescheduled(); }}
        />
      )}
    </>
  );
};

export default BookingCard;
