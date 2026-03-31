import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ROLE_REDIRECTS = {
  admin: '/admin',
  expert: '/expert-dashboard',
  user: '/dashboard',
};

const GoogleAuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Completing sign-in...');

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const token = searchParams.get('token');
      const roleHint = searchParams.get('role'); // fast-path hint from backend

      if (!token) {
        navigate('/login?error=no_token');
        return;
      }

      try {
        // Fetch full user profile using the token
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/google/current`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          navigate('/login?error=auth_failed');
          return;
        }

        const userData = await response.json();

        // Persist credentials
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ ...userData, token }));
        sessionStorage.setItem('session_alive', '1');

        const destination = ROLE_REDIRECTS[userData.role] || '/dashboard';
        setStatus(`Welcome, ${userData.name}! Redirecting...`);

        // Hard navigate so AuthProvider re-reads localStorage
        window.location.href = destination;
      } catch (error) {
        console.error('Google auth error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleGoogleAuth();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-cyan-500">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
        <p className="text-xl font-medium">{status}</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccessPage;
