import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, roles, redirectTo = '/login' }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user?.role)) {
    const roleHome = { user: '/dashboard', expert: '/expert-dashboard', admin: '/admin' };
    return <Navigate to={roleHome[user?.role] || '/'} replace />;
  }

  return children;
};

export default PrivateRoute;
