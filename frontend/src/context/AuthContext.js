import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Updated API URL handling to ensure string format
  const API_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_API_URL || 'http://localhost:4000')
    : `${window.location.protocol}//${window.location.hostname}:4000`;

  // Setup axios defaults
  useEffect(() => {
    if (typeof API_URL === 'string') {
      axios.defaults.baseURL = API_URL;
      console.log('API URL set to:', API_URL);
    } else {
      // Fallback to a safe default if API_URL is somehow not a string
      axios.defaults.baseURL = 'http://localhost:4000';
      console.log('API URL defaulted to: http://localhost:4000');
    }
  }, [API_URL]);

  // Add auth token to headers with type checking
  const setAuthToken = (token) => {
    if (token && typeof token === 'string') {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
      if (token && typeof token !== 'string') {
        console.error('Invalid token format: token must be a string');
      }
    }
  };

  // Login user
  const login = async (username, password) => {
    try {
      console.log('Attempting login to:', `${axios.defaults.baseURL}/api/auth/login`);
      const res = await axios.post('/api/auth/login', { username, password });
      
      // Validate token format before setting it
      const { token, user } = res.data;
      
      if (!token || typeof token !== 'string') {
        console.error('Invalid token received from server');
        return false;
      }
      
      setAuthToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Load user from token
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    
    if (token && typeof token === 'string') {
      setAuthToken(token);
      try {
        const res = await axios.get('/api/auth/user');
        setCurrentUser(res.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation error:', error);
        setAuthToken(null);
      }
    }
    
    setLoading(false);
  };

  // On mount, check for token
  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
