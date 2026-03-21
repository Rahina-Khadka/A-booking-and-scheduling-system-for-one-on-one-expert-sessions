import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleAuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Completing authentication...');

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const token = searchParams.get('token');

      if (!token) {
        navigate('/admin/login?error=no_token');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          navigate('/admin/login?error=auth_failed');
          return;
        }

        const userData = await response.json();

        if (userData.role !== 'admin') {
          navigate('/admin/login?error=unauthorized');
          return;
        }

        // Store credentials
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        // Mark session as alive so AuthProvider keeps the user logged in
        sessionStorage.setItem('session_alive', '1');

        setStatus('Access granted. Redirecting to Admin Dashboard...');
        // Hard reload so AuthProvider picks up the new localStorage state
        window.location.href = '/admin';
      } catch (error) {
        console.error('Google auth error:', error);
        navigate('/admin/login?error=auth_failed');
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
