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

  const isPaid = booking.payment?.status === 'paid';
  const isPaymentPending = booking.payment?.status === 'pending';

  const canJoinSession = booking.status === 'confirmed' && (isExpert || isPaid);

  // Pay Now for confirmed+unpaid OR completed+unpaid
  const mustPay = !isExpert && (
    (booking.status === 'confirmed' && !isPaid && !isPaymentPending) ||
    (booking.status === 'completed' && !isPaid && !isPaymentPending)
  );

  // Review: only after completed AND payment confirmed paid
  const canReview = !isExpert && booking.status === 'completed' && isPaid;

  // Cancel: only on pending or confirmed, not completed
  const canCancel = !isExpert && ['pending', 'confirmed'].includes(booking.status);

  // Reschedule: only on pending or confirmed
  const canReschedule = !isExpert && ['pending', 'confirmed'].includes(booking.status);

  const canDownloadInvoice = !isExpert && isPaid;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              {isExpert ? `Session with ${user?.name}` : `Session with ${expert?.name}`}
            </h3>
            <p className="text-stone-600 text-sm">
              {isExpert ? user?.email : expert?.email}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-stone-700">
          <p><span className="font-medium">Date:</span> {formatDate(booking.date)}</p>
          <p><span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}</p>
          {booking.topic && <p><span className="font-medium">Topic:</span> {booking.topic}</p>}
          {booking.notes && <p><span className="font-medium">Notes:</span> {booking.notes}</p>}
          {/* Payment status badge */}
          {!isExpert && booking.payment && (
            <p>
              <span className="font-medium">Payment:</span>{' '}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                booking.payment.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                booking.payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                booking.payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-stone-600'
              }`}>
                {booking.payment.status === 'paid' ? '💰 Paid' :
                 booking.payment.status === 'pending' ? '⏳ Verifying' :
                 booking.payment.status === 'unpaid' ? '⚠ Unpaid' :
                 booking.payment.status}
              </span>
            </p>
          )}
        </div>

        {/* Payment required banner */}
        {mustPay && booking.status === 'confirmed' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-700">Payment Required to Join</p>
              <p className="text-xs text-amber-600 mt-0.5">Your session is confirmed. Please pay to unlock the Join button.</p>
            </div>
          </div>
        )}
        {mustPay && booking.status === 'completed' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Payment Required</p>
              <p className="text-xs text-red-600 mt-0.5">Your session is complete. Please pay to unlock your review.</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {/* Join Session */}
          {canJoinSession && (
            <Link
              to={`/session/${String(booking._id)}`}
              className="flex-1 bg-green-500 text-white text-center px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Join Session
            </Link>
          )}

          {/* Expert: accept/reject pending */}
          {isExpert && booking.status === 'pending' && (
            <>
              <button onClick={() => onStatusChange(String(booking._id), 'confirmed')}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                Accept
              </button>
              <button onClick={() => onStatusChange(String(booking._id), 'rejected')}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Reject
              </button>
            </>
          )}

          {/* Expert: mark complete */}
          {isExpert && booking.status === 'confirmed' && (
            <button onClick={() => onStatusChange(String(booking._id), 'completed')}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Mark as Completed
            </button>
          )}

          {/* Learner: cancel (pending or confirmed only) */}
          {canCancel && (
            <button onClick={() => setShowCancelModal(true)}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
              Cancel Booking
            </button>
          )}

          {/* Learner: reschedule (pending or confirmed only) */}
          {canReschedule && (
            <button onClick={() => setShowRescheduleModal(true)}
              className="flex-1 bg-accent-600 text-white hover:bg-accent-700">
              Reschedule
            </button>
          )}

          {/* Learner: pay now (completed + unpaid) */}
          {mustPay && (
            <button onClick={() => setShowPaymentModal(true)}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold animate-pulse">
              💳 Pay Now
            </button>
          )}

          {/* Learner: verifying payment badge */}
          {!isExpert && booking.status === 'completed' && isPaymentPending && (
            <span className="flex-1 text-center text-xs font-semibold px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
              ⏳ Payment Verifying
            </span>
          )}

          {/* Learner: leave review (completed + paid only) */}
          {canReview && (
            <button onClick={() => setShowReviewModal(true)}
              className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">
              ⭐ Leave Review
            </button>
          )}

          {/* Invoice download */}
          {canDownloadInvoice && (
            <button onClick={() => invoiceService.downloadInvoice(String(booking._id))}
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              📄 Invoice
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
