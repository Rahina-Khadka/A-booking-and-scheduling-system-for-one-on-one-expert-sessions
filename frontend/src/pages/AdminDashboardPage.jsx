import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [pendingExperts, setPendingExperts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [docViewer, setDocViewer] = useState(null); // { expert, docKey }

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
      const [statsData, usersData, expertsData, bookingsData, pendingData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAllUsers(),
        adminService.getAllExperts(),
        adminService.getAllBookings(),
        adminService.getPendingExperts()
      ]);

      setStats(statsData.stats);
      setUsers(usersData);
      setExperts(expertsData);
      setBookings(bookingsData);
      setPendingExperts(pendingData);
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

  const handleVerifyExpert = async (expertId, status) => {
    try {
      await adminService.verifyExpert(expertId, status);
      fetchData();
    } catch (error) {
      alert('Failed to update verification status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Navbar />
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-lg">🛡️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">System management panel</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['overview', 'verification', 'users', 'experts', 'bookings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {tab === 'verification' && pendingExperts.length > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${activeTab === tab ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                  {pendingExperts.length}
                </span>
              )}
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {[
                { label:'Total Users', value: stats.totalUsers, color:'bg-indigo-50 border-indigo-100 text-indigo-700', icon:'👥' },
                { label:'Total Experts', value: stats.totalExperts, color:'bg-green-50 border-green-100 text-green-700', icon:'🎓' },
                { label:'Total Bookings', value: stats.totalBookings, color:'bg-cyan-50 border-cyan-100 text-cyan-700', icon:'📅' },
                { label:'Completed Sessions', value: stats.completedBookings, color:'bg-blue-50 border-blue-100 text-blue-700', icon:'✅' },
                { label:'Pending Bookings', value: stats.pendingBookings, color:'bg-yellow-50 border-yellow-100 text-yellow-700', icon:'⏳' },
                { label:'Total Reviews', value: stats.totalReviews, color:'bg-purple-50 border-purple-100 text-purple-700', icon:'⭐' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-xs font-medium opacity-70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-bold text-gray-900">Expert Verification</h2>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {pendingExperts.length} pending
              </span>
            </div>
            {pendingExperts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-500 text-sm">No pending verifications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingExperts.map(expert => (
                  <div key={expert._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                          {expert.profilePicture
                            ? <img src={expert.profilePicture} alt="" className="w-full h-full object-cover" />
                            : expert.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{expert.name}</p>
                          <p className="text-xs text-gray-500">{expert.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Registered {new Date(expert.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyExpert(expert._id, 'approved')}
                          className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleVerifyExpert(expert._id, 'rejected')}
                          className="px-4 py-2 rounded-xl bg-red-100 text-red-600 text-sm font-semibold hover:bg-red-200 transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>

                    {/* Expertise tags */}
                    {expert.expertise?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {expert.expertise.map((s, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-100">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Documents */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Uploaded Documents</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'resume', label: 'Resume / CV' },
                          { key: 'certificate', label: 'Certificate' },
                          { key: 'experienceProof', label: 'Experience' },
                          { key: 'governmentId', label: 'Gov. ID' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => expert.documents?.[key] ? setDocViewer({ expert, docKey: key, label }) : null}
                            disabled={!expert.documents?.[key]}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                              expert.documents?.[key]
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                                : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-xl">{expert.documents?.[key] ? '📄' : '—'}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {docViewer && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDocViewer(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">{docViewer.label}</p>
                  <p className="text-xs text-gray-500">{docViewer.expert.name}</p>
                </div>
                <button onClick={() => setDocViewer(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl">×</button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
                {docViewer.expert.documents[docViewer.docKey].startsWith('data:image') ? (
                  <img
                    src={docViewer.expert.documents[docViewer.docKey]}
                    alt={docViewer.label}
                    className="max-w-full max-h-[60vh] rounded-xl shadow-md object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-5xl mb-4">📄</p>
                    <p className="text-sm text-gray-600 mb-4">This document is a PDF or non-image file.</p>
                    <a
                      href={docViewer.expert.documents[docViewer.docKey]}
                      download={`${docViewer.expert.name}-${docViewer.docKey}`}
                      className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
                    >
                      Download Document
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
