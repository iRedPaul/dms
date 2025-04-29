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
  IconButton,
  Chip,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../context/AuthContext';
import UserManagement from '../components/admin/UserManagement';
import MailboxManagement from '../components/admin/MailboxManagement';

// Constants
const DRAWER_WIDTH = 240;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Close mobile drawer when tab changes
    setMobileDrawerOpen(false);
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

  // Drawer content for both permanent and temporary drawers
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Admin-Bereich
        </Typography>
      </Box>
      
      <List component="nav" sx={{ px: 1, py: 2, flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === 0} 
            onClick={() => handleTabChange(null, 0)}
            sx={{ 
              borderRadius: 2,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: activeTab === 0 ? 'white' : 'inherit', 
              minWidth: 40
            }}>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Benutzerverwaltung" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 0 ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === 1} 
            onClick={() => handleTabChange(null, 1)}
            sx={{ 
              borderRadius: 2,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: activeTab === 1 ? 'white' : 'inherit', 
              minWidth: 40
            }}>
              <FolderSpecialIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Postkorbverwaltung" 
              primaryTypographyProps={{ 
                fontWeight: activeTab === 1 ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            disabled
            sx={{ 
              borderRadius: 2,
              mb: 1,
              opacity: 0.6
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Statistiken" 
              secondary="In Entwicklung"
              secondaryTypographyProps={{ fontSize: '0.7rem' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<HomeIcon />}
          onClick={handleBack}
          sx={{ mb: 1 }}
        >
          Zur Hauptseite
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          fullWidth 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Abmelden
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)' 
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 600
            }}
          >
            DMS System - Admin Dashboard
          </Typography>
          
          <Chip
            avatar={
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.dark',
                  color: 'white'
                }}
              >
                {currentUser?.username?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
            }
            label={currentUser?.username || 'Admin'}
            variant="filled"
            color="primary"
            sx={{ 
              mr: 2,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '& .MuiChip-label': {
                color: 'white',
                px: 1
              }
            }}
          />
          
          <IconButton 
            color="inherit" 
            onClick={handleBack} 
            sx={{ mr: 1 }}
            aria-label="zurück zur Hauptseite"
          >
            <HomeIcon />
          </IconButton>
          
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            aria-label="abmelden"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Permanent drawer for larger screens */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: DRAWER_WIDTH, 
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: 'none'
            },
          }}
        >
          <Toolbar /> {/* Empty space for AppBar */}
          {drawerContent}
        </Drawer>
      )}
      
      {/* Temporary drawer for mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, 
          pt: { xs: 8, sm: 9 },
          overflow: 'auto',
          bgcolor: '#f5f7fa',
          height: '100vh'
        }}
      >
        <Container maxWidth="xl" sx={{ mb: 4 }}>
          {successMessage && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              {successMessage}
            </Alert>
          )}
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              {error}
            </Alert>
          )}
          
          {/* Main content area */}
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}
          >
            {/* Mobile tabs - only visible on small screens */}
            {isMobile && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <Tab 
                    label="Benutzer" 
                    icon={<GroupIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Postkörbe" 
                    icon={<FolderSpecialIcon />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
            )}
            
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
    </Box>
  );
}

export default AdminDashboard;
