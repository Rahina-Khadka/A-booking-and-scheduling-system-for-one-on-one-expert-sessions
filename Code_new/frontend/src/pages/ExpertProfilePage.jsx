import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import expertService from '../services/expertService';
import reviewService from '../services/reviewService';

/**
 * Expert Profile Page Component
 * Displays detailed information about an expert
 */
const ExpertProfilePage = () => {
  const { id } = useParams();
  const [expert, setExpert] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpert();
    fetchReviews();
  }, [id]);

  const fetchExpert = async () => {
    try {
      const data = await expertService.getExpertById(id);
      setExpert(data);
    } catch (error) {
      console.error('Error fetching expert:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getExpertReviews(id);
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Expert not found</h2>
          <Link to="/experts" className="text-primary hover:underline mt-4 inline-block">
            Back to Experts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <Link to="/experts" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Experts
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{expert.name}</h1>
            <p className="text-gray-600">{expert.email}</p>
            
            <div className="flex items-center mt-4">
              <span className="text-yellow-500 text-xl">★</span>
              <span className="ml-2 text-lg text-gray-700">
                {expert.rating?.toFixed(1) || '0.0'} ({expert.totalRatings || 0} reviews)
              </span>
            </div>
          </div>

          {/* Bio */}
          {expert.bio && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">{expert.bio}</p>
            </div>
          )}

          {/* Expertise */}
          {expert.expertise && expert.expertise.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {expert.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {expert.availability && expert.availability.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Availability</h2>
              <div className="space-y-2">
                {expert.availability.map((schedule, index) => (
                  <div key={index} className="flex items-center">
                    <span className="font-medium text-gray-700 w-32">{schedule.day}:</span>
                    <div className="flex flex-wrap gap-2">
                      {schedule.slots && schedule.slots.length > 0 ? (
                        schedule.slots.map((slot, slotIndex) => (
                          <span
                            key={slotIndex}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm"
                          >
                            {slot.startTime} - {slot.endTime}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Not available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.userId?.name}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.review && (
                      <p className="text-gray-700">{review.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book Button */}
          <div className="mt-8">
            <Link
              to={`/book/${expert._id}`}
              className="block w-full bg-primary text-white text-center px-6 py-3 rounded-lg text-lg hover:bg-indigo-700"
            >
              Book a Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfilePage;
