import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExpertListPage from './pages/ExpertListPage';
import ExpertProfilePage from './pages/ExpertProfilePage';
import BookingPage from './pages/BookingPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import SessionRoomPage from './pages/SessionRoomPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import GoogleAuthSuccessPage from './pages/GoogleAuthSuccessPage';

/**
 * Main App Component
 * Handles routing and authentication context
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
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
            <PrivateRoute>
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
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminDashboardPage />
            </PrivateRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
