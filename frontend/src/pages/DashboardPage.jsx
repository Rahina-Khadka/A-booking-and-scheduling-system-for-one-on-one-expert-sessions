// Legacy redirect — role-based routing now handled by App.jsx + PrivateRoute
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();
  if (user?.role === 'expert') return <Navigate to="/expert-dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default DashboardPage;
