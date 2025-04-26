import React, { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  Upload as UploadIcon,
  Archive as ArchiveIcon,
  Inbox as InboxIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Task as TaskIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Breite der Sidebar
const drawerWidth = 240;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useContext(AuthContext);
  
  // State für Sidebar und Benutzermenü
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  
  // Benutzermenü öffnen/schließen
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Benachrichtigungsmenü öffnen/schließen
  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };
  
  // Sidebar öffnen/schließen
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  // Prüfen, ob ein Pfad aktiv ist
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Benutzerinitialen für Avatar
  const getUserInitials = () => {
    if (!user || !user.name) return '?';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
    }
    
    return nameParts[0].charAt(0);
  };

  // Hauptmenü-Elemente
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      roles: ['admin', 'workflow-designer', 'approver', 'user', 'readonly']
    },
    {
      text: 'Dokumente',
      icon: <DocumentIcon />,
      path: '/documents',
      roles: ['admin', 'workflow-designer', 'approver', 'user', 'readonly']
    },
    {
      text: 'Dokument hochladen',
      icon: <UploadIcon />,
      path: '/documents/upload',
      roles: ['admin', 'workflow-designer', 'approver', 'user']
    },
    {
      text: 'Aufgaben',
      icon: <TaskIcon />,
      path: '/tasks',
      roles: ['admin', 'workflow-designer', 'approver', 'user']
    },
    {
      text: 'Archiv',
      icon: <ArchiveIcon />,
      path: '/archive',
      roles: ['admin', 'workflow-designer', 'approver', 'user', 'readonly']
    }
  ];
  
  // Admin-Menü-Elemente
  const adminMenuItems = [
    {
      text: 'Admin-Dashboard',
      icon: <AdminIcon />,
      path: '/admin',
      roles: ['admin']
    },
    {
      text: 'Benutzerverwaltung',
      icon: <AccountIcon />,
      path: '/admin/users',
      roles: ['admin']
    },
    {
      text: 'Postkorbverwaltung',
      icon: <InboxIcon />,
      path: '/admin/inboxes',
      roles: ['admin']
    },
    {
      text: 'Workflow-Designer',
      icon: <SettingsIcon />,
      path: '/admin/workflows',
      roles: ['admin', 'workflow-designer']
    }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Top AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          ...(drawerOpen && !isMobile && { 
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px` 
          })
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dokumentenmanagementsystem
          </Typography>
          
          {/* Benachrichtigungen */}
          <Tooltip title="Benachrichtigungen">
            <IconButton color="inherit" onClick={handleNotificationOpen}>
              <Badge badgeContent={3} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Benutzer-Menü */}
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.name || ''}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={isMobile ? toggleDrawer : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', py: 2 }}>
          {/* Hauptmenü */}
          <List>
            {menuItems.map((item) => (
              user && item.roles.includes(user.role) && (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={isActive(item.path)}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.light + '30',
                        borderRight: `3px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.light + '40'
                        }
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(item.path) ? theme.palette.primary.main : 'inherit'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )
            ))}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Admin-Menü */}
          {user && (hasRole('admin') || hasRole('workflow-designer')) && (
            <List>
              <ListItem>
                <Typography variant="subtitle2" color="text.secondary">
                  Administration
                </Typography>
              </ListItem>
              
              {adminMenuItems.map((item) => (
                user && item.roles.includes(user.role) && (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      selected={isActive(item.path)}
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.secondary.light + '30',
                          borderRight: `3px solid ${theme.palette.secondary.main}`,
                          '&:hover': {
                            backgroundColor: theme.palette.secondary.light + '40'
                          }
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive(item.path) ? theme.palette.secondary.main : 'inherit'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                )
              ))}
            </List>
          )}
        </Box>
      </Drawer>
      
      {/* Hauptinhalt */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* Spacer für AppBar */}
        <Outlet /> {/* Router-Outlet für den Seiteninhalt */}
      </Box>
      
      {/* Benutzermenü */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuClose()}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mein Profil</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClose()}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Einstellungen</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); logout(); }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Abmelden</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Benachrichtigungsmenü */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 320
          }
        }}
      >
        <MenuItem>
          <Typography variant="subtitle2">
            Rechnung zur Prüfung
          </Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="subtitle2">
            Neues Dokument in Postkorb "Einkauf"
          </Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="subtitle2">
            Workflow "Vertragsfreigabe" abgeschlossen
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationClose}>
          <Typography variant="body2" color="primary">
            Alle Benachrichtigungen anzeigen
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;