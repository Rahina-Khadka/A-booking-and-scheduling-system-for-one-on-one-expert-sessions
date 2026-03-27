import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const errorMessages = {
  unauthorized: 'Unauthorized admin access. Your Google account is not authorized.',
  auth_failed: 'Authentication failed. Please try again.',
  no_token: 'Authentication error. Please try again.',
};

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const urlError = searchParams.get('error');

  const [tab, setTab] = useState('google'); // 'google' | 'email'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(errorMessages[urlError] || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') navigate('/admin');
  }, [isAuthenticated, user, navigate]);

  const handleGoogleLogin = () => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${base}/api/auth/google?role=admin`;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await authService.login(formData);
      if (userData.role !== 'admin') {
        setError('Unauthorized admin access. This account does not have admin privileges.');
        authService.logout();
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-white">ExpertBook</span>
          </Link>
          <p className="text-white/70 mt-2 text-sm">Admin Portal</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          {/* Shield icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Admin Login</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Only authorized accounts can access this panel</p>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm"
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {[
              { key: 'google', label: 'Google OAuth' },
              { key: 'email', label: 'Email & Password' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'google' ? (
            <div className="space-y-4">
              <motion.button
                onClick={handleGoogleLogin}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium shadow-sm"
              >
                <GoogleIcon />
                Continue with Google
              </motion.button>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-800 mb-1">🔒 Restricted Access</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Only the Gmail address configured in <code className="bg-amber-100 px-1 rounded">ADMIN_EMAIL</code> can sign in. All other accounts will be denied.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Email</label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm bg-white/80"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password" name="password" value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm bg-white/80"
                  placeholder="••••••••"
                />
              </div>
              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In as Admin'}
              </motion.button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
