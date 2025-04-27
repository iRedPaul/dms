import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import api from '../services/api';

// Auth-Kontext erstellen
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Logout-Funktion
  const logout = useCallback(() => {
    console.log('=== LOGOUT INITIATED ===');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    console.log('User logged out, token cleared, redirecting to login page');
    navigate('/login');
  }, [navigate]);

  // Beim ersten Laden überprüfen, ob ein gültiges Token vorhanden ist
  useEffect(() => {
    const checkAuth = async () => {
      console.log('=== CHECKING AUTHENTICATION ===');
      
      if (token) {
        console.log(`Token exists (first 20 chars): ${token.substring(0, 20)}...`);
        
        try {
          // Token auf Gültigkeit prüfen
          console.log('Decoding JWT token...');
          const decodedToken = jwtDecode(token);
          console.log('Token payload:', decodedToken);
          
          const currentTime = Date.now() / 1000;
          console.log(`Current time: ${currentTime}, Token expiry: ${decodedToken.exp}`);
          
          if (decodedToken.exp < currentTime) {
            // Token ist abgelaufen
            console.log('Token has expired, logging out');
            logout();
          } else {
            // API-Header für Token setzen
            console.log('Token is valid, setting Authorization header');
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Benutzerdaten abrufen
            console.log('Fetching current user data from API...');
            try {
              const response = await api.get('/api/auth/me');
              console.log('User data received:', response.data);
              setUser(response.data);
            } catch (apiError) {
              console.error('API error when fetching user data:', apiError);
              console.error('Response:', apiError.response?.data);
              console.error('Status:', apiError.response?.status);
              logout();
            }
          }
        } catch (error) {
          console.error('Error during authentication check:', error);
          logout();
        }
      } else {
        console.log('No token found in localStorage');
      }
      
      setLoading(false);
      console.log('Authentication check completed, loading state set to false');
    };

    checkAuth();
  }, [token, logout]);

  // Login-Funktion
  const login = async (username, password) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('Password length:', password.length);
    
    try {
      console.log('Making login request to /api/auth/login');
      console.log('Request payload:', { username, password });
      
      // API-Anfrage zur Anmeldung
      const response = await api.post('/api/auth/login', { username, password });
      console.log('Login response:', response.data);
      
      const { token: newToken, user: userData } = response.data;
      console.log(`Received token (first 20 chars): ${newToken.substring(0, 20)}...`);
      console.log('Received user data:', userData);
      
      // Token und Benutzerdaten speichern
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // API-Header für Token setzen
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      console.log('Authorization header set for future requests');
      
      console.log('=== LOGIN SUCCESSFUL ===');
      return { success: true };
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error details:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        return {
          success: false,
          message: error.response?.data?.message || 'Fehler bei der Anmeldung',
          status: error.response.status
        };
      } else if (error.request) {
        console.error('No response received from server');
        console.error('Request details:', error.request);
        
        return {
          success: false,
          message: 'Keine Antwort vom Server erhalten. Bitte überprüfen Sie Ihre Internetverbindung.',
        };
      } else {
        console.error('Error message:', error.message);
        
        return {
          success: false,
          message: 'Ein unerwarteter Fehler ist aufgetreten: ' + error.message
        };
      }
    }
  };

  // Passwort ändern
  const changePassword = async (currentPassword, newPassword) => {
    console.log('=== CHANGE PASSWORD ATTEMPT ===');
    
    try {
      console.log('Making request to /api/auth/change-password');
      
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      console.log('Password changed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      console.error('Response:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Ändern des Passworts'
      };
    }
  };

  // Prüfen, ob Benutzer eine bestimmte Rolle hat
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        changePassword,
        hasRole,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
