import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Inbox as InboxIcon,
  Settings as SettingsIcon,
  Description as DocumentIcon,
  Task as TaskIcon,
  Notifications as NotificationIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  BugReport as BugIcon,
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import api from '../../services/api';

// Komponente für eine statistische Karte
const StatCard = ({ title, value, icon, color, description, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          cursor: 'pointer'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: 1,
              mr: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {value !== null ? value : <CircularProgress size={24} />}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
      {onClick && (
        <CardActions>
          <Button size="small" endIcon={<ArrowIcon />}>Details</Button>
        </CardActions>
      )}
    </Card>
  );
};

// Aktivitätskomponente
const ActivityItem = ({ icon, title, description, time, color }) => {
  return (
    <ListItem alignItems="flex-start">
      <ListItemIcon>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={title}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.primary">
              {description}
            </Typography>
            <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              {time}
            </Typography>
          </>
        }
      />
    </ListItem>
  );
};

// Generating dummy system activities
const generateDummyActivities = () => {
  const now = new Date();
  const activities = [
    {
      icon: <PeopleIcon />,
      title: 'Neuer Benutzer registriert',
      description: 'Benutzer "Maria Schmidt" wurde vom Administrator hinzugefügt.',
      time: '5 Minuten',
      color: '#4caf50'
    },
    {
      icon: <UploadIcon />,
      title: 'Neue Dokumente hochgeladen',
      description: '12 neue Dokumente wurden zum System hinzugefügt.',
      time: '15 Minuten',
      color: '#2196f3'
    },
    {
      icon: <SettingsIcon />,
      title: 'Workflow aktualisiert',
      description: 'Der Workflow "Rechnungsfreigabe" wurde aktualisiert.',
      time: '30 Minuten',
      color: '#ff9800'
    },
    {
      icon: <InboxIcon />,
      title: 'Neuer Postkorb erstellt',
      description: 'Postkorb "Marketing" wurde erstellt und 3 Benutzern zugewiesen.',
      time: '1 Stunde',
      color: '#9c27b0'
    },
    {
      icon: <BugIcon />,
      title: 'Systemwarnung',
      description: 'Speicherplatz liegt unter 20%. Bereinigung empfohlen.',
      time: '2 Stunden',
      color: '#f44336'
    }
  ];
  
  return activities;
};

// Admin-Dashboard-Komponente
const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // States für Dashboard-Daten
  const [stats, setStats] = useState({
    users: null,
    documents: null,
    inboxes: null,
    workflows: null,
    storage: null,
    tasks: null
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Daten laden
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In einer realen App würden die Daten von der API geladen werden
        // await api.get('/api/admin/dashboard');
        
        // Für Demo-Zwecke verwenden wir simulierte Daten mit Verzögerung
        setTimeout(() => {
          setStats({
            users: 34,
            documents: 1285,
            inboxes: 12,
            workflows: 8,
            storage: 62, // Speicherbelegung in Prozent
            tasks: 47
          });
          
          setActivities(generateDummyActivities());
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setError('Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Berechnung des Speicherplatzes
  const getStorageColor = (percentage) => {
    if (percentage < 50) return theme.palette.success.main;
    if (percentage < 80) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin-Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Übersicht und Verwaltung des Dokumentenmanagementsystems
        </Typography>
      </Box>
      
      {/* Hauptstatistiken */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Benutzer"
            value={stats.users}
            icon={<PeopleIcon sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
            description="Registrierte Benutzer"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dokumente"
            value={stats.documents}
            icon={<DocumentIcon sx={{ color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
            description="Gespeicherte Dokumente"
            onClick={() => navigate('/documents')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Postkörbe"
            value={stats.inboxes}
            icon={<InboxIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
            description="Aktive Postkörbe"
            onClick={() => navigate('/admin/inboxes')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Workflows"
            value={stats.workflows}
            icon={<SettingsIcon sx={{ color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
            description="Definierte Workflows"
            onClick={() => navigate('/admin/workflows')}
          />
        </Grid>
      </Grid>
      
      {/* Hauptinhalt */}
      <Grid container spacing={3}>
        {/* Systemstatus und Speicher */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Systemstatus
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Speichernutzung
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                    <CircularProgress
                      variant="determinate"
                      value={stats.storage || 0}
                      size={100}
                      thickness={5}
                      sx={{ 
                        color: getStorageColor(stats.storage),
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round'
                        }
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" component="div" color="text.secondary">
                        {stats.storage}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {stats.storage < 50 
                      ? 'Ausreichend Speicherplatz vorhanden' 
                      : stats.storage < 80 
                        ? 'Speicherplatz wird knapp' 
                        : 'Kritischer Speicherplatz!'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Offene Aufgaben
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TaskIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                    <Typography variant="h5" component="div">
                      {stats.tasks || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Aufgaben, die auf Bearbeitung warten
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Systeminfo
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sicherheitsstatus"
                      secondary={
                        <Chip 
                          label="Aktuell" 
                          size="small" 
                          color="success"
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Letzte Sicherung"
                      secondary="Heute, 03:00 Uhr"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BugIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Systemwarnungen"
                      secondary={
                        <Chip 
                          label="1 Warnung" 
                          size="small" 
                          color="warning"
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                  </ListItem>
                </List>
                
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<StorageIcon />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Speicher optimieren
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    fullWidth
                  >
                    Backup erstellen
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Letzte Aktivitäten */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Letzte Aktivitäten</Typography>
              <Button 
                size="small" 
                endIcon={<ArrowIcon />}
              >
                Alle anzeigen
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <List sx={{ pt: 0 }}>
                {activities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ActivityItem 
                      icon={activity.icon}
                      title={activity.title}
                      description={activity.description}
                      time={`vor ${activity.time}`}
                      color={activity.color}
                    />
                    {index < activities.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Schnellzugriff */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Administration und Schnellzugriff
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                      <Typography variant="h6">Benutzerverwaltung</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Benutzer erstellen, bearbeiten und verwalten.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/admin/users')}
                      endIcon={<ArrowIcon />}
                    >
                      Öffnen
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InboxIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                      <Typography variant="h6">Postkorbverwaltung</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Postkörbe erstellen und konfigurieren.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/admin/inboxes')}
                      endIcon={<ArrowIcon />}
                    >
                      Öffnen
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SettingsIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                      <Typography variant="h6">Workflow-Designer</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Workflows erstellen und anpassen.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/admin/workflows')}
                      endIcon={<ArrowIcon />}
                    >
                      Öffnen
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <NotificationIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                      <Typography variant="h6">Benachrichtigungen</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      System- und Benutzerbenachrichtigungen konfigurieren.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" endIcon={<ArrowIcon />}>
                      Öffnen
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;