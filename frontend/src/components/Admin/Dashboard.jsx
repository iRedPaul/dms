import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Description as DocumentIcon,
  Task as TaskIcon,
  Inbox as InboxIcon,
  Notifications as NotificationIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// Statistik-Karte Komponente
const StatCard = ({ title, value, icon, color, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        minWidth: 200, 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? { 
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              backgroundColor: `${color}20`, 
              borderRadius: '50%',
              p: 1,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value !== null ? value : <CircularProgress size={24} />}
        </Typography>
      </CardContent>
      {onClick && (
        <CardActions>
          <Button size="small" endIcon={<ArrowIcon />}>Details</Button>
        </CardActions>
      )}
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // State für Dashboard-Daten
  const [stats, setStats] = useState({
    documents: null,
    tasks: null,
    inboxes: null,
    notifications: null
  });
  
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard-Daten laden
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In einer realen App würden hier API-Aufrufe stehen
        // Für Demo-Zwecke verwenden wir Beispieldaten
        
        // Statistiken laden
        setTimeout(() => {
          setStats({
            documents: 42,
            tasks: 7,
            inboxes: 3,
            notifications: 5
          });
        }, 1000);
        
        // Neueste Dokumente laden
        setTimeout(() => {
          setRecentDocuments([
            { id: 1, title: 'Rechnung 2023-001', type: 'invoice', date: '2023-06-15' },
            { id: 2, title: 'Vertrag mit Kunde XYZ', type: 'contract', date: '2023-06-14' },
            { id: 3, title: 'Monatsbericht Mai', type: 'report', date: '2023-06-10' },
            { id: 4, title: 'Angebot 2023-005', type: 'other', date: '2023-06-08' }
          ]);
        }, 1200);
        
        // Anstehende Aufgaben laden
        setTimeout(() => {
          setPendingTasks([
            { id: 1, title: 'Rechnung 2023-001 prüfen', workflow: 'Rechnungsfreigabe', dueDate: '2023-06-20' },
            { id: 2, title: 'Vertrag mit Kunde XYZ genehmigen', workflow: 'Vertragsfreigabe', dueDate: '2023-06-18' },
            { id: 3, title: 'Monatsbericht Mai finalisieren', workflow: 'Berichterstellung', dueDate: '2023-06-25' }
          ]);
          
          setLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Farben für verschiedene Karten
  const colors = {
    documents: theme.palette.primary.main,
    tasks: theme.palette.warning.main,
    inboxes: theme.palette.success.main,
    notifications: theme.palette.secondary.main
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {user && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Willkommen zurück, {user.name}!
        </Typography>
      )}
      
      {/* Statistik-Karten */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dokumente"
            value={stats.documents}
            icon={<DocumentIcon sx={{ color: colors.documents }} />}
            color={colors.documents}
            onClick={() => navigate('/documents')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aufgaben"
            value={stats.tasks}
            icon={<TaskIcon sx={{ color: colors.tasks }} />}
            color={colors.tasks}
            onClick={() => navigate('/tasks')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Postkörbe"
            value={stats.inboxes}
            icon={<InboxIcon sx={{ color: colors.inboxes }} />}
            color={colors.inboxes}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Benachrichtigungen"
            value={stats.notifications}
            icon={<NotificationIcon sx={{ color: colors.notifications }} />}
            color={colors.notifications}
          />
        </Grid>
      </Grid>
      
      {/* Hauptinhalt */}
      <Grid container spacing={3}>
        {/* Neueste Dokumente */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Neueste Dokumente</Typography>
              <Button 
                size="small" 
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/documents')}
              >
                Alle anzeigen
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {recentDocuments.map((doc) => (
                  <ListItem
                    key={doc.id}
                    button
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemIcon>
                      <DocumentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={doc.title}
                      secondary={`${doc.type} • ${doc.date}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Anstehende Aufgaben */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Anstehende Aufgaben</Typography>
              <Button 
                size="small" 
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/tasks')}
              >
                Alle anzeigen
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {pendingTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemIcon>
                      <TaskIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={task.title}
                      secondary={`${task.workflow} • Fällig am: ${task.dueDate}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
