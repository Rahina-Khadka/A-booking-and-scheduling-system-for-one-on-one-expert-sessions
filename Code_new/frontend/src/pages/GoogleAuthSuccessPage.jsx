import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Google Auth Success Page
 * Handles the redirect after successful Google OAuth
 */
const GoogleAuthSuccessPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const token = searchParams.get('token');

      if (!token) {
        navigate('/admin/login?error=no_token');
        return;
      }

      try {
        // Decode token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Store token and user info
        localStorage.setItem('token', token);
        
        // Fetch user details
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/current`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Update auth context
          window.location.href = '/admin';
        } else {
          navigate('/admin/login?error=auth_failed');
        }
      } catch (error) {
        console.error('Error handling Google auth:', error);
        navigate('/admin/login?error=auth_failed');
      }
    };

    handleGoogleAuth();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-xl text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccessPage;
