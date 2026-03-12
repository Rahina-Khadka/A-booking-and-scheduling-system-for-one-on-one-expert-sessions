import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import adminService from '../services/adminService';

/**
 * Admin Dashboard Page Component
 * Admin panel for system management
 */
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [experts, setExperts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, expertsData, bookingsData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAllUsers(),
        adminService.getAllExperts(),
        adminService.getAllBookings()
      ]);

      setStats(statsData.stats);
      setUsers(usersData);
      setExperts(expertsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        fetchData();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchData();
    } catch (error) {
      alert('Failed to update user role');
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            {['overview', 'users', 'experts', 'bookings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Experts</h3>
                <p className="text-3xl font-bold text-secondary">{stats.totalExperts}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Bookings</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalBookings}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Completed Sessions</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.completedBookings}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Bookings</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Reviews</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'expert' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Experts Tab */}
        {activeTab === 'experts' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {experts.map((expert) => (
                  <tr key={expert._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{expert.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{expert.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ⭐ {expert.rating?.toFixed(1) || '0.0'} ({expert.totalRatings || 0})
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {expert.expertise?.slice(0, 3).map((skill, i) => (
                          <span key={i} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteUser(expert._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.userId?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.expertId?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(booking.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.startTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
