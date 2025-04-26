import React, { createContext, useState, useEffect } from 'react';
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

  // Beim ersten Laden überprüfen, ob ein gültiges Token vorhanden ist
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Token auf Gültigkeit prüfen
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token ist abgelaufen
            logout();
          } else {
            // API-Header für Token setzen
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Benutzerdaten abrufen
            const response = await api.get('/api/auth/me');
            setUser(response.data);
          }
        } catch (error) {
          console.error('Authentifizierungsfehler:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login-Funktion
  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { token: newToken, user: userData } = response.data;
      
      // Token und Benutzerdaten speichern
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // API-Header für Token setzen
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login-Fehler:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler bei der Anmeldung'
      };
    }
  };

  // Logout-Funktion
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // Passwort ändern
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      return { success: true };
    } catch (error) {
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