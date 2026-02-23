import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

/**
 * Custom hook to access auth state and actions.
 * Throws if used outside of <AuthProvider>.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Provides authentication state (user, loading) and actions
 * (login, signup, logout) to the entire app via React Context.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await authService.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  };

  const signup = async (userData) => {
    const { data } = await authService.signup(userData);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    toast.success('Account created successfully!');
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Logout locally even if the API call fails
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
