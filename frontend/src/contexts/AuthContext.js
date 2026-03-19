import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    // First try with stored token
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setUser(response.data);
        setError(null);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('auth_token');
      }
    }
    
    // Fallback to cookie-based auth
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      setError(null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (identifier, password, rememberMe = false) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { identifier, password, remember_me: rememberMe },
        { withCredentials: true }
      );
      
      // Store token in localStorage as backup
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      setUser(response.data.user);
      setError(null);
      return { success: true, user: response.data.user };
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signup = async (token, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/signup`,
        { token, password },
        { withCredentials: true }
      );
      setUser(response.data.user);
      setError(null);
      return { success: true, user: response.data.user };
    } catch (err) {
      const message = err.response?.data?.detail || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      return { success: true, message: response.data.message, token: response.data.reset_token };
    } catch (err) {
      const message = err.response?.data?.detail || 'Request failed';
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, password });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Reset failed';
      return { success: false, error: message };
    }
  };

  const validateInvite = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/validate-invite/${token}`);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid invite';
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    validateInvite,
    refreshUser: fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
