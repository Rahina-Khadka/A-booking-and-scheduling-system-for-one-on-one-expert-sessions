import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

/**
 * Navbar Component
 * Main navigation bar with authentication actions
 */
const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              ExpertBook
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary px-3 py-2">
                  Dashboard
                </Link>
                <Link to="/experts" className="text-gray-700 hover:text-primary px-3 py-2">
                  Experts
                </Link>
                <Link to="/bookings" className="text-gray-700 hover:text-primary px-3 py-2">
                  Bookings
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary px-3 py-2">
                    Admin
                  </Link>
                )}
                <NotificationBell />
                <span className="text-gray-600">Hi, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary px-3 py-2">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Register
                </Link>
                <Link
                  to="/admin/login"
                  className="text-gray-700 hover:text-primary px-3 py-2 border border-gray-300 rounded-lg"
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
