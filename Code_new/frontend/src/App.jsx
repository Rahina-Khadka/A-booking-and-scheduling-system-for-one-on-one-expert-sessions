import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboardPage from './pages/UserDashboardPage';
import ExpertDashboardPage from './pages/ExpertDashboardPage';
import ExpertListPage from './pages/ExpertListPage';
import ExpertProfilePage from './pages/ExpertProfilePage';
import BookingPage from './pages/BookingPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import SessionRoomPage from './pages/SessionRoomPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import GoogleAuthSuccessPage from './pages/GoogleAuthSuccessPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />

          {/* User dashboard */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={['user']}>
              <UserDashboardPage />
            </PrivateRoute>
          } />

          {/* Expert dashboard */}
          <Route path="/expert-dashboard" element={
            <PrivateRoute roles={['expert']}>
              <ExpertDashboardPage />
            </PrivateRoute>
          } />

          {/* Admin dashboard */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboardPage />
            </PrivateRoute>
          } />

          {/* Shared protected routes */}
          <Route path="/experts" element={
            <PrivateRoute>
              <ExpertListPage />
            </PrivateRoute>
          } />
          <Route path="/experts/:id" element={
            <PrivateRoute>
              <ExpertProfilePage />
            </PrivateRoute>
          } />
          <Route path="/book/:expertId" element={
            <PrivateRoute roles={['user']}>
              <BookingPage />
            </PrivateRoute>
          } />
          <Route path="/bookings" element={
            <PrivateRoute>
              <BookingHistoryPage />
            </PrivateRoute>
          } />
          <Route path="/session/:bookingId" element={
            <PrivateRoute>
              <SessionRoomPage />
            </PrivateRoute>
          } />

          {/* Legacy redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
