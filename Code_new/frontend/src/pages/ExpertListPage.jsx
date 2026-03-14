import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ExpertCard from '../components/ExpertCard';
import expertService from '../services/expertService';

/**
 * Expert List Page Component
 * Displays all available experts with search and filter
 */
const ExpertListPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [filterExpertise, setFilterExpertise] = useState('');

  // Get unique expertise fields
  const allExpertise = [...new Set(experts.flatMap(e => e.expertise || []))];

  useEffect(() => {
    fetchExperts();
  }, [showRecommended]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const data = showRecommended 
        ? await expertService.getRecommendedExperts()
        : await expertService.getExperts();
      setExperts(data);
    } catch (error) {
      console.error('Error fetching experts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperts = experts.filter(expert => {
    // Search filter
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.expertise?.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Rating filter
    const matchesRating = filterRating === 0 || (expert.rating || 0) >= filterRating;

    // Expertise filter
    const matchesExpertise = !filterExpertise || 
      expert.expertise?.some(skill => skill === filterExpertise);

    return matchesSearch && matchesRating && matchesExpertise;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Expert</h1>
          
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by name or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={() => setShowRecommended(!showRecommended)}
                className={`px-6 py-2 rounded-lg whitespace-nowrap ${
                  showRecommended
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {showRecommended ? 'Show All' : 'Show Recommended'}
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Expertise
                </label>
                <select
                  value={filterExpertise}
                  onChange={(e) => setFilterExpertise(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Fields</option>
                  {allExpertise.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="0">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterRating > 0 || filterExpertise || searchTerm) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Search: {searchTerm}
                  </span>
                )}
                {filterExpertise && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Expertise: {filterExpertise}
                  </span>
                )}
                {filterRating > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Rating: {filterRating}+ stars
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRating(0);
                    setFilterExpertise('');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading experts...</div>
          </div>
        ) : filteredExperts.length > 0 ? (
          <>
            <p className="text-gray-600 mb-4">
              Showing {filteredExperts.length} expert{filteredExperts.length !== 1 ? 's' : ''}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperts.map((expert) => (
                <ExpertCard key={expert._id} expert={expert} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No experts found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertListPage;
