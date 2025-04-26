import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inbox as InboxIcon,
  Business as DepartmentIcon,
  Person as UserIcon,
  AccountTree as WorkflowIcon,
  Settings as SystemIcon,
  Email as EmailIcon,
  Notifications as NotificationIcon,
  People as PeopleIcon,
  DeleteSweep as ClearIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../services/api';

// Postkorb-Typen mit Icons und Farben
const inboxTypes = {
  department: { 
    label: 'Abteilung', 
    icon: <DepartmentIcon />, 
    color: '#2196f3',
    description: 'Postkorb für eine Abteilung oder einen Bereich'
  },
  user: { 
    label: 'Benutzer', 
    icon: <UserIcon />, 
    color: '#4caf50',
    description: 'Persönlicher Postkorb für einen Benutzer'
  },
  workflow: { 
    label: 'Workflow', 
    icon: <WorkflowIcon />, 
    color: '#ff9800',
    description: 'Postkorb für einen bestimmten Workflow oder Prozess'
  },
  system: { 
    label: 'System', 
    icon: <SystemIcon />, 
    color: '#9c27b0',
    description: 'Systempostkorb für automatisierte Prozesse'
  }
};

// Generieren von Dummy-Postkörben
const generateDummyInboxes = () => {
  const inboxes = [
    {
      _id: 'inbox1',
      name: 'Eingang',
      description: 'Allgemeiner Posteingang für neue Dokumente',
      type: 'department',
      assignedUsers: [
        { _id: 'user1', name: 'Max Mustermann' },
        { _id: 'user2', name: 'Erika Musterfrau' }
      ],
      documentCount: 28,
      notificationSettings: {
        emailNotification: {
          enabled: true,
          recipients: ['team@example.com']
        },
        autoAssign: {
          enabled: false,
          assignmentStrategy: 'manual'
        }
      },
      isActive: true,
      createdAt: new Date('2023-01-01'),
      createdBy: { _id: 'admin1', name: 'Administrator' }
    },
    {
      _id: 'inbox2',
      name: 'Rechnungswesen',
      description: 'Dokumente für die Buchhaltung und Finanzen',
      type: 'department',
      assignedUsers: [
        { _id: 'user3', name: 'Thomas Test' },
        { _id: 'user4', name: 'Sabine Schmidt' }
      ],
      documentCount: 15,
      notificationSettings: {
        emailNotification: {
          enabled: true,
          recipients: ['finance@example.com']
        },
        autoAssign: {
          enabled: true,
          assignmentStrategy: 'round_robin'
        }
      },
      isActive: true,
      createdAt: new Date('2023-01-10'),
      createdBy: { _id: 'admin1', name: 'Administrator' }
    },
    {
      _id: 'inbox3',
      name: 'Vertrieb',
      description: 'Dokumente für den Vertrieb und Aufträge',
      type: 'department',
      assignedUsers: [
        { _id: 'user5', name: 'Peter Peters' },
        { _id: 'user6', name: 'Laura Lang' }
      ],
      documentCount: 22,
      notificationSettings: {
        emailNotification: {
          enabled: true,
          recipients: ['sales@example.com']
        },
        autoAssign: {
          enabled: false,
          assignmentStrategy: 'manual'
        }
      },
      isActive: true,
      createdAt: new Date('2023-01-15'),
      createdBy: { _id: 'admin1', name: 'Administrator' }
    }
  ];
  
  // Weitere Postkörbe generieren
  const departments = ['Einkauf', 'Personal', 'IT', 'Marketing', 'Kundenservice', 'Produktion'];
  const types = ['department', 'workflow', 'user', 'system'];
  
  for (let i = 1; i <= 15; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365));
    
    inboxes.push({
      _id: `inbox${i + 3}`,
      name: type === 'department' 
        ? departments[Math.floor(Math.random() * departments.length)]
        : type === 'workflow'
          ? `Workflow ${i}`
          : type === 'user'
            ? `Persönlicher Postkorb ${i}`
            : `System ${i}`,
      description: `Beschreibung für ${type === 'department' ? 'Abteilung' : type === 'workflow' ? 'Workflow' : type === 'user' ? 'Benutzer' : 'System'} ${i}`,
      type,
      assignedUsers: [
        { _id: `user${i*2-1}`, name: `Benutzer ${i*2-1}` },
        { _id: `user${i*2}`, name: `Benutzer ${i*2}` }
      ].slice(0, Math.floor(Math.random() * 3) + 1), // 1-3 Benutzer
      documentCount: Math.floor(Math.random() * 30),
      notificationSettings: {
        emailNotification: {
          enabled: Math.random() > 0.3,
          recipients: [`${type}${i}@example.com`]
        },
        autoAssign: {
          enabled: Math.random() > 0.7,
          assignmentStrategy: ['manual', 'round_robin', 'workload_balanced'][Math.floor(Math.random() * 3)]
        }
      },
      isActive: Math.random() > 0.1, // 90% aktiv
      createdAt: createdDate,
      createdBy: { _id: 'admin1', name: 'Administrator' }
    });
  }
  
  return inboxes;
};

// Dummy-Benutzer für Zuweisungen
const generateDummyUsers = () => [
  { _id: 'user1', name: 'Max Mustermann' },
  { _id: 'user2', name: 'Erika Musterfrau' },
  { _id: 'user3', name: 'Thomas Test' },
  { _id: 'user4', name: 'Sabine Schmidt' },
  { _id: 'user5', name: 'Peter Peters' },
  { _id: 'user6', name: 'Laura Lang' },
  { _id: 'user7', name: 'Michael Müller' },
  { _id: 'user8', name: 'Sandra Schmitz' },
  { _id: 'user9', name: 'Tobias Tester' },
  { _id: 'user10', name: 'Nina Neumann' }
];

const InboxManagement = () => {
  const theme = useTheme();
  
  // State für Postkorbliste
  const [inboxes, setInboxes] = useState([]);
  const [filteredInboxes, setFilteredInboxes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination-State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Such- und Filter-State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Dialog-States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  
  // Ausgewählter Postkorb für Dialoge
  const [selectedInbox, setSelectedInbox] = useState(null);
  
  // Formular-Daten für neuen Postkorb
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'department',
    assignedUsers: [],
    notificationSettings: {
      emailNotification: {
        enabled: false,
        recipients: []
      },
      autoAssign: {
        enabled: false,
        assignmentStrategy: 'manual'
      }
    },
    isActive: true
  });
  
  // E-Mail-Eingabefeld
  const [emailInput, setEmailInput] = useState('');
  
  // Daten laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In einer realen App würden die Daten von der API geladen werden
        // const inboxResponse = await api.get('/api/inboxes');
        // const userResponse = await api.get('/api/users');
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyInboxes = generateDummyInboxes();
          const dummyUsers = generateDummyUsers();
          
          setInboxes(dummyInboxes);
          setFilteredInboxes(dummyInboxes);
          setUsers(dummyUsers);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Postkörbe filtern
  useEffect(() => {
    if (!inboxes.length) return;
    
    let filtered = [...inboxes];
    
    // Textsuche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(inbox => 
        inbox.name.toLowerCase().includes(searchLower) ||
        inbox.description.toLowerCase().includes(searchLower) ||
        inbox.assignedUsers.some(user => user.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Typenfilter
    if (typeFilter) {
      filtered = filtered.filter(inbox => inbox.type === typeFilter);
    }
    
    // Statusfilter
    if (statusFilter === 'active') {
      filtered = filtered.filter(inbox => inbox.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(inbox => !inbox.isActive);
    }
    
    setFilteredInboxes(filtered);
    setPage(0); // Zurück zur ersten Seite bei Filteränderung
  }, [inboxes, searchTerm, typeFilter, statusFilter]);
  
  // Such-Handler
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Pagination-Handler
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Formular-Handler
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    
    if (name.startsWith('notificationSettings.')) {
      const path = name.split('.');
      setFormData({
        ...formData,
        notificationSettings: {
          ...formData.notificationSettings,
          [path[1]]: {
            ...formData.notificationSettings[path[1]],
            [path[2]]: type === 'checkbox' ? checked : value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // E-Mail hinzufügen
  const handleAddEmail = () => {
    if (!emailInput || !emailInput.includes('@')) return;
    
    const newRecipients = [...formData.notificationSettings.emailNotification.recipients];
    if (!newRecipients.includes(emailInput)) {
      newRecipients.push(emailInput);
      
      setFormData({
        ...formData,
        notificationSettings: {
          ...formData.notificationSettings,
          emailNotification: {
            ...formData.notificationSettings.emailNotification,
            recipients: newRecipients
          }
        }
      });
    }
    
    setEmailInput('');
  };
  
  // E-Mail entfernen
  const handleRemoveEmail = (email) => {
    const newRecipients = formData.notificationSettings.emailNotification.recipients.filter(
      recipient => recipient !== email
    );
    
    setFormData({
      ...formData,
      notificationSettings: {
        ...formData.notificationSettings,
        emailNotification: {
          ...formData.notificationSettings.emailNotification,
          recipients: newRecipients
        }
      }
    });
  };
  
  // Benutzer-Handler
  const handleUserChange = (event, newValue) => {
    setFormData({
      ...formData,
      assignedUsers: newValue
    });
  };
  
  // Dialog-Handler
  const handleOpenCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      type: 'department',
      assignedUsers: [],
      notificationSettings: {
        emailNotification: {
          enabled: false,
          recipients: []
        },
        autoAssign: {
          enabled: false,
          assignmentStrategy: 'manual'
        }
      },
      isActive: true
    });
    setCreateDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };
  
  const handleOpenEditDialog = (inbox) => {
    setSelectedInbox(inbox);
    setFormData({
      name: inbox.name,
      description: inbox.description,
      type: inbox.type,
      assignedUsers: inbox.assignedUsers,
      notificationSettings: {
        emailNotification: {
          enabled: inbox.notificationSettings.emailNotification.enabled,
          recipients: [...inbox.notificationSettings.emailNotification.recipients]
        },
        autoAssign: {
          enabled: inbox.notificationSettings.autoAssign.enabled,
          assignmentStrategy: inbox.notificationSettings.autoAssign.assignmentStrategy
        }
      },
      isActive: inbox.isActive
    });
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedInbox(null);
  };
  
  const handleOpenDeleteDialog = (inbox) => {
    setSelectedInbox(inbox);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedInbox(null);
  };
  
  const handleOpenEmptyDialog = (inbox) => {
    setSelectedInbox(inbox);
    setEmptyDialogOpen(true);
  };
  
  const handleCloseEmptyDialog = () => {
    setEmptyDialogOpen(false);
    setSelectedInbox(null);
  };
  
  // CRUD-Operationen
  const handleCreateInbox = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.post('/api/inboxes', formData);
    
    // Für Demo-Zwecke fügen wir den Postkorb lokal hinzu
    const newInbox = {
      _id: `inbox${Date.now()}`,
      ...formData,
      documentCount: 0,
      createdAt: new Date(),
      createdBy: { _id: 'admin1', name: 'Administrator' }
    };
    
    setInboxes([...inboxes, newInbox]);
    handleCloseCreateDialog();
    
    // Erfolgsmeldung
    alert('Postkorb erfolgreich erstellt');
  };
  
  const handleUpdateInbox = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/inboxes/${selectedInbox._id}`, formData);
    
    // Für Demo-Zwecke aktualisieren wir den Postkorb lokal
    const updatedInboxes = inboxes.map(inbox => {
      if (inbox._id === selectedInbox._id) {
        return {
          ...inbox,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          assignedUsers: formData.assignedUsers,
          notificationSettings: formData.notificationSettings,
          isActive: formData.isActive
        };
      }
      return inbox;
    });
    
    setInboxes(updatedInboxes);
    handleCloseEditDialog();
    
    // Erfolgsmeldung
    alert('Postkorb erfolgreich aktualisiert');
  };
  
  const handleDeleteInbox = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.delete(`/api/inboxes/${selectedInbox._id}`);
    
    // Für Demo-Zwecke entfernen wir den Postkorb lokal
    const updatedInboxes = inboxes.filter(inbox => inbox._id !== selectedInbox._id);
    
    setInboxes(updatedInboxes);
    handleCloseDeleteDialog();
    
    // Erfolgsmeldung
    alert('Postkorb erfolgreich gelöscht');
  };
  
  const handleEmptyInbox = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.post(`/api/inboxes/${selectedInbox._id}/empty`);
    
    // Für Demo-Zwecke setzen wir die Dokumentenzahl auf 0
    const updatedInboxes = inboxes.map(inbox => {
      if (inbox._id === selectedInbox._id) {
        return {
          ...inbox,
          documentCount: 0
        };
      }
      return inbox;
    });
    
    setInboxes(updatedInboxes);
    handleCloseEmptyDialog();
    
    // Erfolgsmeldung
    alert(`Postkorb "${selectedInbox.name}" wurde geleert`);
  };
  
  const handleToggleInboxStatus = (inbox) => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/inboxes/${inbox._id}/toggle-status`);
    
    // Für Demo-Zwecke aktualisieren wir den Status lokal
    const updatedInboxes = inboxes.map(i => {
      if (i._id === inbox._id) {
        return {
          ...i,
          isActive: !i.isActive
        };
      }
      return i;
    });
    
    setInboxes(updatedInboxes);
    
    // Erfolgsmeldung
    alert(`Postkorb "${inbox.name}" wurde ${inbox.isActive ? 'deaktiviert' : 'aktiviert'}`);
  };
  
  // Hilfsfunktionen
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy', { locale: de });
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };
  
  // Typ als Chip darstellen
  const renderTypeChip = (type) => {
    const typeInfo = inboxTypes[type] || { label: type, color: '#757575', icon: <InboxIcon /> };
    
    return (
      <Chip
        icon={typeInfo.icon}
        label={typeInfo.label}
        size="small"
        sx={{
          backgroundColor: `${typeInfo.color}20`,
          color: typeInfo.color,
          '& .MuiChip-icon': {
            color: typeInfo.color
          }
        }}
      />
    );
  };
  
  // Status als Chip darstellen
  const renderStatusChip = (active) => {
    return (
      <Chip
        label={active ? 'Aktiv' : 'Inaktiv'}
        size="small"
        color={active ? 'success' : 'default'}
        variant={active ? 'filled' : 'outlined'}
      />
    );
  };
  
  // Zugewiesene Benutzer anzeigen
  const renderAssignedUsers = (assignedUsers) => {
    if (!assignedUsers || assignedUsers.length === 0) {
      return <Typography variant="body2" color="text.secondary">Keine</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {assignedUsers.map((user) => (
          <Chip
            key={user._id}
            label={user.name}
            size="small"
            icon={<UserIcon />}
          />
        ))}
      </Box>
    );
  };
  
  // Benachrichtigungseinstellungen anzeigen
  const renderNotificationSettings = (settings) => {
    if (!settings) return null;
    
    return (
      <Box>
        {settings.emailNotification?.enabled && (
          <Chip
            icon={<EmailIcon />}
            label="E-Mail-Benachrichtigung"
            size="small"
            color="primary"
            sx={{ mr: 0.5 }}
          />
        )}
        {settings.autoAssign?.enabled && (
          <Chip
            icon={<PeopleIcon />}
            label="Auto-Zuweisung"
            size="small"
            color="secondary"
          />
        )}
      </Box>
    );
  };
  
  // Paginierte Postkörbe
  const paginatedInboxes = filteredInboxes
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Leere Zeilen für Pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredInboxes.length - page * rowsPerPage);
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Postkorb-Verwaltung</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Neuer Postkorb
        </Button>
      </Box>
      
      {/* Such- und Filterleiste */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Suchen..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Typ</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Typ"
              >
                <MenuItem value="">Alle Typen</MenuItem>
                {Object.entries(inboxTypes).map(([key, { label }]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">Alle Status</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="inactive">Inaktiv</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setStatusFilter('');
              }}
            >
              Filter zurücksetzen
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Postkörbe-Tabelle */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Beschreibung</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell>Benutzer</TableCell>
                    <TableCell>Dokumente</TableCell>
                    <TableCell>Benachrichtigungen</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Erstellt am</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInboxes.map((inbox) => (
                    <TableRow
                      key={inbox._id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>{inbox.name}</TableCell>
                      <TableCell>{inbox.description}</TableCell>
                      <TableCell>{renderTypeChip(inbox.type)}</TableCell>
                      <TableCell>{renderAssignedUsers(inbox.assignedUsers)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{inbox.documentCount}</Typography>
                      </TableCell>
                      <TableCell>{renderNotificationSettings(inbox.notificationSettings)}</TableCell>
                      <TableCell>{renderStatusChip(inbox.isActive)}</TableCell>
                      <TableCell>{formatDate(inbox.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Bearbeiten">
                            <IconButton onClick={() => handleOpenEditDialog(inbox)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Postkorb leeren">
                            <IconButton 
                              onClick={() => handleOpenEmptyDialog(inbox)} 
                              size="small" 
                              disabled={inbox.documentCount === 0}
                            >
                              <ClearIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={inbox.isActive ? 'Deaktivieren' : 'Aktivieren'}>
                            <IconButton 
                              onClick={() => handleToggleInboxStatus(inbox)}
                              size="small"
                              color={inbox.isActive ? 'default' : 'primary'}
                            >
                              {inbox.isActive ? <DeleteIcon /> : <InboxIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton 
                              onClick={() => handleOpenDeleteDialog(inbox)} 
                              size="small" 
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={9} />
                    </TableRow>
                  )}
                  
                  {filteredInboxes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <InboxIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Keine Postkörbe gefunden
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Versuchen Sie, Ihre Suchkriterien anzupassen
                          </Typography>
                          <Button 
                            variant="outlined"
                            onClick={() => {
                              setSearchTerm('');
                              setTypeFilter('');
                              setStatusFilter('');
                            }}
                            sx={{ mt: 2 }}
                          >
                            Filter zurücksetzen
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredInboxes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Zeilen pro Seite:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} von ${count !== -1 ? count : `mehr als ${to}`}`
              }
            />
          </>
        )}
      </Paper>
      
      {/* Dialog: Postkorb erstellen */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neuen Postkorb erstellen</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Beschreibung"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Typ</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Typ"
                >
                  {Object.entries(inboxTypes).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Postkorb ist aktiv"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Benutzer zuweisen
              </Typography>
              <Autocomplete
                multiple
                id="assigned-users"
                options={users}
                value={formData.assignedUsers}
                onChange={handleUserChange}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Zugewiesene Benutzer"
                    placeholder="Benutzer hinzufügen"
                    fullWidth
                  />
                )}
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" gutterBottom>
                Benachrichtigungseinstellungen
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    name="notificationSettings.emailNotification.enabled"
                    checked={formData.notificationSettings.emailNotification.enabled}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="E-Mail-Benachrichtigung aktivieren"
              />
              
              {formData.notificationSettings.emailNotification.enabled && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={9}>
                      <TextField
                        fullWidth
                        label="E-Mail-Adresse"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Button
                        variant="outlined"
                        onClick={handleAddEmail}
                        fullWidth
                        sx={{ height: '100%' }}
                      >
                        Hinzufügen
                      </Button>
                    </Grid>
                  </Grid>
                  
                  <List dense sx={{ mt: 1 }}>
                    {formData.notificationSettings.emailNotification.recipients.map((email) => (
                      <ListItem key={email}>
                        <ListItemIcon>
                          <EmailIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={email} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemoveEmail(email)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    name="notificationSettings.autoAssign.enabled"
                    checked={formData.notificationSettings.autoAssign.enabled}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Automatische Zuweisung aktivieren"
              />
              
              {formData.notificationSettings.autoAssign.enabled && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Zuweisungsstrategie</InputLabel>
                  <Select
                    name="notificationSettings.autoAssign.assignmentStrategy"
                    value={formData.notificationSettings.autoAssign.assignmentStrategy}
                    onChange={handleInputChange}
                    label="Zuweisungsstrategie"
                  >
                    <MenuItem value="manual">Manuell</MenuItem>
                    <MenuItem value="round_robin">Rundlauf (Round Robin)</MenuItem>
                    <MenuItem value="workload_balanced">Lastenausgleich</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Postkorb-Typ Information
              </Typography>
              <Box sx={{ pl: 2, pr: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>{inboxTypes[formData.type]?.label}:</strong> {inboxTypes[formData.type]?.description}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Abbrechen</Button>
          <Button 
            onClick={handleCreateInbox} 
            variant="contained"
            disabled={!formData.name}
          >
            Postkorb erstellen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Postkorb bearbeiten */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Postkorb bearbeiten</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Beschreibung"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Typ</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Typ"
                >
                  {Object.entries(inboxTypes).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Postkorb ist aktiv"
              />
              
              {selectedInbox && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Erstellt am:</strong> {formatDate(selectedInbox.createdAt)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Erstellt von:</strong> {selectedInbox.createdBy.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Dokumente:</strong> {selectedInbox.documentCount}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Benutzer zuweisen
              </Typography>
              <Autocomplete
                multiple
                id="assigned-users-edit"
                options={users}
                value={formData.assignedUsers}
                onChange={handleUserChange}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Zugewiesene Benutzer"
                    placeholder="Benutzer hinzufügen"
                    fullWidth
                  />
                )}
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" gutterBottom>
                Benachrichtigungseinstellungen
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    name="notificationSettings.emailNotification.enabled"
                    checked={formData.notificationSettings.emailNotification.enabled}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="E-Mail-Benachrichtigung aktivieren"
              />
              
              {formData.notificationSettings.emailNotification.enabled && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={9}>
                      <TextField
                        fullWidth
                        label="E-Mail-Adresse"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Button
                        variant="outlined"
                        onClick={handleAddEmail}
                        fullWidth
                        sx={{ height: '100%' }}
                      >
                        Hinzufügen
                      </Button>
                    </Grid>
                  </Grid>
                  
                  <List dense sx={{ mt: 1 }}>
                    {formData.notificationSettings.emailNotification.recipients.map((email) => (
                      <ListItem key={email}>
                        <ListItemIcon>
                          <EmailIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={email} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemoveEmail(email)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    name="notificationSettings.autoAssign.enabled"
                    checked={formData.notificationSettings.autoAssign.enabled}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Automatische Zuweisung aktivieren"
              />
              
              {formData.notificationSettings.autoAssign.enabled && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Zuweisungsstrategie</InputLabel>
                  <Select
                    name="notificationSettings.autoAssign.assignmentStrategy"
                    value={formData.notificationSettings.autoAssign.assignmentStrategy}
                    onChange={handleInputChange}
                    label="Zuweisungsstrategie"
                  >
                    <MenuItem value="manual">Manuell</MenuItem>
                    <MenuItem value="round_robin">Rundlauf (Round Robin)</MenuItem>
                    <MenuItem value="workload_balanced">Lastenausgleich</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Abbrechen</Button>
          <Button 
            onClick={handleUpdateInbox} 
            variant="contained"
            disabled={!formData.name}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Postkorb löschen */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Postkorb löschen</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Möchten Sie den Postkorb "{selectedInbox?.name}" wirklich löschen?
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </Typography>
          {selectedInbox && selectedInbox.documentCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Dieser Postkorb enthält {selectedInbox.documentCount} Dokumente, die beim Löschen
              des Postkorbs ebenfalls entfernt werden.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Abbrechen</Button>
          <Button onClick={handleDeleteInbox} color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Postkorb leeren */}
      <Dialog
        open={emptyDialogOpen}
        onClose={handleCloseEmptyDialog}
      >
        <DialogTitle>Postkorb leeren</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Möchten Sie alle Dokumente aus dem Postkorb "{selectedInbox?.name}" entfernen?
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </Typography>
          {selectedInbox && selectedInbox.documentCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Dieser Postkorb enthält {selectedInbox.documentCount} Dokumente, die entfernt werden.
              Die Dokumente selbst werden nicht gelöscht, sondern nur aus dem Postkorb entfernt.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmptyDialog}>Abbrechen</Button>
          <Button onClick={handleEmptyInbox} color="warning">
            Postkorb leeren
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InboxManagement;