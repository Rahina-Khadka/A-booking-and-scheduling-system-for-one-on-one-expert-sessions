import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import userService from '../services/userService';
import expertService from '../services/expertService';
import bookingService from '../services/bookingService';

/**
 * Dashboard Page Component
 * Main dashboard for users and experts
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recommendedExperts, setRecommendedExperts] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    interests: [],
    expertise: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileData, bookingsData] = await Promise.all([
        userService.getProfile(),
        bookingService.getBookings()
      ]);

      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        interests: profileData.interests || [],
        expertise: profileData.expertise || []
      });
      setRecentBookings(bookingsData.slice(0, 3));

      // Fetch recommended experts for users
      if (user.role === 'user') {
        const recommended = await expertService.getRecommendedExperts();
        setRecommendedExperts(recommended.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
    setFormData({
      ...formData,
      [field]: values
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await userService.updateProfile(formData);
      setProfile(updated);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'expert' ? 'Expert Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome to your {user.role} dashboard, {profile?.name}!
          </p>
        </div>

        {/* Expert Dashboard Layout */}
        {user.role === 'expert' ? (
          <div className="space-y-6">
            {/* Action Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Manage Schedule Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Manage Schedule</h3>
                  <span className="text-3xl">📅</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Set your availability and manage time slots.
                </p>
                <button className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                  Manage Schedule
                </button>
              </div>

              {/* Session Requests Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Session Requests</h3>
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Review and approve booking requests.
                </p>
                <Link
                  to="/bookings"
                  className="block w-full bg-orange-500 text-white text-center px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  View Requests
                </Link>
              </div>

              {/* Earnings Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
                  <span className="text-3xl">💰</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Track your earnings and payment history.
                </p>
                <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  View Earnings
                </button>
              </div>

              {/* Reviews & Ratings Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Reviews & Ratings</h3>
                  <span className="text-3xl">⭐</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  View client feedback and respond to reviews.
                </p>
                <button className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  View Reviews
                </button>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Upcoming Sessions */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h3>
                  <span className="text-2xl">📅</span>
                </div>
                {recentBookings.filter(b => b.status === 'confirmed').length > 0 ? (
                  <div className="space-y-3">
                    {recentBookings.filter(b => b.status === 'confirmed').map((booking) => (
                      <div key={booking._id} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <p className="font-medium text-gray-900">{booking.userId?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString()} • {booking.startTime}
                        </p>
                        <p className="text-sm text-gray-500">{booking.topic}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No upcoming sessions scheduled.</p>
                )}
              </div>

              {/* Profile Stats */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Stats</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recentBookings.filter(b => b.status === 'completed').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.rating > 0 ? `${profile.rating.toFixed(1)} ⭐` : 'Not rated yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">N/A</p>
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* User Dashboard - Keep existing layout */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Profile</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-primary hover:underline"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {!editMode ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-lg font-medium">{profile?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg">{profile?.email}</p>
                    </div>
                    {profile?.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-lg">{profile.phone}</p>
                      </div>
                    )}
                    {profile?.bio && (
                      <div>
                        <p className="text-sm text-gray-600">Bio</p>
                        <p className="text-lg">{profile.bio}</p>
                      </div>
                    )}
                    {profile?.interests?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest, index) => (
                            <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interests (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.interests.join(', ')}
                        onChange={(e) => handleArrayChange(e, 'interests')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Web Development, Data Science, AI"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </form>
                )}
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Recent Bookings</h2>
                  <Link to="/bookings" className="text-primary hover:underline">
                    View All
                  </Link>
                </div>
                {recentBookings.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking._id} className="border-l-4 border-primary pl-4">
                        <p className="font-medium">{booking.expertId?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString()} • {booking.startTime}
                        </p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{booking.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No bookings yet</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/experts"
                    className="block w-full bg-primary text-white text-center px-4 py-3 rounded-lg hover:bg-indigo-700"
                  >
                    Browse Experts
                  </Link>
                  <Link
                    to="/bookings"
                    className="block w-full bg-secondary text-white text-center px-4 py-3 rounded-lg hover:bg-cyan-600"
                  >
                    View Bookings
                  </Link>
                </div>
              </div>

              {/* Recommended Experts */}
              {recommendedExperts.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">Recommended Experts</h3>
                  <div className="space-y-4">
                    {recommendedExperts.map((expert) => (
                      <div key={expert._id} className="border-b pb-4 last:border-b-0">
                        <p className="font-medium">{expert.name}</p>
                        <p className="text-sm text-gray-600">{expert.expertise?.slice(0, 2).join(', ')}</p>
                        <Link
                          to={`/experts/${expert._id}`}
                          className="text-primary text-sm hover:underline"
                        >
                          View Profile →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Profile Modal for Experts */}
        {editMode && user.role === 'expert' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Profile</h2>
                <button
                  onClick={() => setEditMode(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expertise (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.expertise.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'expertise')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
