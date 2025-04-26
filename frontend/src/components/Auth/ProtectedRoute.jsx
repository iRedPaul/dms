import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * ProtectedRoute - Schützt Routen vor unautorisierten Zugriffen
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Die geschützten Komponenten
 * @param {string|string[]} [props.requiredRole] - Optional: Erforderliche Benutzerrolle(n)
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading, hasRole } = useContext(AuthContext);
  const location = useLocation();

  // Ladebildschirm anzeigen, wenn der Auth-Status noch geprüft wird
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Authentifizierung wird überprüft...
        </Typography>
      </Box>
    );
  }

  // Zur Login-Seite umleiten, wenn nicht authentifiziert
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rollenprüfung, falls erforderlich
  if (requiredRole && user) {
    const hasRequiredRole = hasRole(requiredRole);
    
    if (!hasRequiredRole) {
      // Bei fehlender Berechtigung zur Startseite umleiten
      return <Navigate to="/" replace />;
    }
  }

  // Geschützte Komponenten rendern, wenn alle Prüfungen bestanden wurden
  return children;
};

export default ProtectedRoute;