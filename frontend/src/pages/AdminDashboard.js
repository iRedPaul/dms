import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Paper,
  Tab,
  Tabs,
  Alert,
  IconButton
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../context/AuthContext';
import UserManagement from '../components/admin/UserManagement';
import MailboxManagement from '../components/admin/MailboxManagement';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear messages when changing tabs
    setError('');
    setSuccessMessage('');
  };

  const handleBack = () => {
    navigate('/');
  };

  // Handle success message
  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setError('');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Handle error message
  const handleError = (message) => {
    setError(message);
    setSuccessMessage('');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={4}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DMS System - Admin Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {currentUser?.username || 'Admin'}
          </Typography>
          <IconButton color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
            <HomeIcon />
          </IconButton>
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Benutzerverwaltung" />
            <Tab label="Postkorbverwaltung" />
          </Tabs>
          
          <Box p={3}>
            {activeTab === 0 && (
              <UserManagement onSuccess={handleSuccess} onError={handleError} />
            )}
            
            {activeTab === 1 && (
              <MailboxManagement onSuccess={handleSuccess} onError={handleError} />
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminDashboard;
