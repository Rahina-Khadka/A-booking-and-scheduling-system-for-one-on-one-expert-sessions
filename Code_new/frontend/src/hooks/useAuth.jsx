import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage is cleared when the browser tab/window is closed or
    // when the dev server restarts and the page reloads fresh.
    // If 'session_alive' is not set, this is a brand-new session → force logout.
    const isAlive = sessionStorage.getItem('session_alive');
    if (!isAlive) {
      // New session — clear any persisted auth
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    // Session is alive (user navigated within the same tab session)
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const userData = await authService.login(credentials);
    sessionStorage.setItem('session_alive', '1'); // mark session as active
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const newUser = await authService.register(userData);
    sessionStorage.setItem('session_alive', '1');
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    sessionStorage.removeItem('session_alive');
    setUser(null);
  };

  // Called by GoogleAuthSuccessPage after OAuth login
  const setUserFromToken = (userData) => {
    sessionStorage.setItem('session_alive', '1');
    setUser(userData);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    setUserFromToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
