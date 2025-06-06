import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Aktualisierte API URL Handhabung für Cloudflare Integration
  const API_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_API_URL || 'https://dms.home-lan.cc/api')
    : `${window.location.protocol}//${window.location.hostname}:4000`;

  // Setup axios defaults and interceptors
  useEffect(() => {
    // Set baseURL - für Cloudflare Zero Trust
    if (typeof API_URL === 'string') {
      // Wenn wir die Basis-URL auf /api setzen, müssen wir "/api" aus allen Anfragen entfernen
      // da es bereits in der Basis-URL enthalten ist
      const baseURL = API_URL.endsWith('/api') 
        ? API_URL.substring(0, API_URL.length - 4) 
        : API_URL;
      axios.defaults.baseURL = baseURL;
      console.log('API URL set to:', baseURL);
    } else {
      // Fallback auf sichere URL mit Domain
      axios.defaults.baseURL = 'https://dms.home-lan.cc';
      console.log('API URL defaulted to: https://dms.home-lan.cc');
    }

    // Setup response interceptor for global error handling
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Handle session expiration
        if (error.response && error.response.status === 401) {
          // Clear token and user state if unauthorized
          localStorage.removeItem('token');
          setCurrentUser(null);
          setIsAuthenticated(false);
          setAuthError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [API_URL]);

  // Add auth token to headers with type checking
  const setAuthToken = useCallback((token) => {
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
  }, []);

  // Login user
  const login = async (username, password) => {
    try {
      setAuthError(null);
      console.log('Attempting login to:', `${axios.defaults.baseURL}/api/auth/login`);
      
      const res = await axios.post('/api/auth/login', { username, password });
      
      // Validate token format before setting it
      const { token, user } = res.data;
      
      if (!token || typeof token !== 'string') {
        console.error('Invalid token received from server');
        setAuthError('Authentifizierungsfehler. Bitte versuchen Sie es erneut.');
        return false;
      }
      
      setAuthToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        setAuthError('Ungültiger Benutzername oder Passwort');
      } else {
        setAuthError('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
      }
      return false;
    }
  };

  // Logout user
  const logout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }, [setAuthToken]);

  // Load user from token
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (token && typeof token === 'string') {
      setAuthToken(token);
      try {
        const res = await axios.get('/api/auth/user');
        setCurrentUser(res.data);
        setIsAuthenticated(true);
        setAuthError(null);
      } catch (error) {
        console.error('Token validation error:', error);
        setAuthToken(null);
        setAuthError('Sitzung abgelaufen. Bitte erneut anmelden.');
      }
    }
    
    setLoading(false);
  }, [setAuthToken]);

  // On mount, check for token
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Handle authentication errors
  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    authError,
    login,
    logout,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
