import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * PrivateRoute — protects routes by auth + optional role check.
 * Props:
 *   roles?: string[]  — if provided, user must have one of these roles
 *   redirectTo?: string — where to send unauthorized users (default: /login)
 */
const PrivateRoute = ({ children, roles, redirectTo = '/login' }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user?.role)) {
    // Redirect to the right dashboard for their role
    const roleHome = { user: '/dashboard', expert: '/expert-dashboard', admin: '/admin' };
    return <Navigate to={roleHome[user?.role] || '/'} replace />;
  }

  return children;
};

export default PrivateRoute;
