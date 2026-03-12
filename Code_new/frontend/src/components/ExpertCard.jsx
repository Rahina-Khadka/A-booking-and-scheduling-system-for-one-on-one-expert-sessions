import { Link } from 'react-router-dom';

/**
 * Expert Card Component
 * Displays expert information in a card format
 */
const ExpertCard = ({ expert }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{expert.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{expert.email}</p>
          
          {expert.bio && (
            <p className="text-gray-700 mt-3 line-clamp-2">{expert.bio}</p>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Expertise:</h4>
            <div className="flex flex-wrap gap-2">
              {expert.expertise?.map((skill, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <span className="text-yellow-500">★</span>
            <span className="ml-1 text-gray-700">
              {expert.rating?.toFixed(1) || '0.0'} ({expert.totalRatings || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to={`/experts/${expert._id}`}
          className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          View Profile
        </Link>
        <Link
          to={`/book/${expert._id}`}
          className="flex-1 text-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Book Session
        </Link>
      </div>
    </div>
  );
};

export default ExpertCard;
