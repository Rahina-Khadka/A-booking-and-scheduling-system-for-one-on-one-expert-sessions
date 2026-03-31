import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAlive = sessionStorage.getItem('session_alive');
    if (!isAlive) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const userData = await authService.login(credentials);
    sessionStorage.setItem('session_alive', '1');
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

  const setUserFromToken = (userData) => {
    sessionStorage.setItem('session_alive', '1');
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
