import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  console.log('=== LOGIN COMPONENT RENDERED ===');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useContext(AuthContext);
  
  console.log('Auth context state:', { isAuthenticated, loading });
  console.log('Current location:', location);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debug info as component mounts
  useEffect(() => {
    console.log('Login component mounted or updated');
    console.log('Redirect state:', location.state);
  }, [location]);

  // Wenn bereits authentifiziert, zur ursprünglichen Seite oder zum Dashboard weiterleiten
  useEffect(() => {
    console.log('Authentication status changed:', { isAuthenticated, loading });
    
    if (isAuthenticated && !loading) {
      const redirectTo = location.state?.from?.pathname || '/';
      console.log(`User is authenticated, redirecting to: ${redirectTo}`);
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form field '${name}' changed`);
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    console.log(`Password visibility toggled to: ${!showPassword}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== LOGIN FORM SUBMITTED ===');
    console.log('Form data:', { ...formData, password: '********' });
    
    setIsSubmitting(true);
    setError(null);

    const { username, password } = formData;

    if (!username || !password) {
      console.log('Missing required fields');
      setError('Bitte geben Sie Benutzername und Passwort ein.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Calling login function from AuthContext');
      const result = await login(username, password);
      console.log('Login result:', result);
      
      if (!result.success) {
        console.log('Login failed:', result.message);
        setError(result.message);
      } else {
        console.log('Login successful');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
      console.log('Form submission complete');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            DMS Login
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            Melden Sie sich an, um auf das Dokumentenmanagementsystem zuzugreifen
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Benutzername"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              size="large"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? 'Anmeldung...' : 'Anmelden'}
            </Button>
          </Box>
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} DMS System
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
