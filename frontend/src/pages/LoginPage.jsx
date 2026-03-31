import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const errorMessages = {
  auth_failed: 'Authentication failed. Please try again.',
  no_token: 'Authentication error. Please try again.',
};

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show error from OAuth redirect if present
  const urlError = searchParams.get('error');
  const displayError = error || errorMessages[urlError] || '';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(formData);
      if (userData.role === 'expert') navigate('/expert-dashboard');
      else if (userData.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${base}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
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
          <p className="text-white/70 mt-2 text-sm">Welcome back</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h2>

          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {displayError}
            </div>
          )}

          {/* Google OAuth */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium shadow-sm mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition bg-white/80 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition bg-white/80 text-sm"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
