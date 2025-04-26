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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  ThumbUp as ApproverIcon,
  Person as UserIcon,
  Visibility as ReadOnlyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Rollen mit Icons und Farben
const userRoles = {
  admin: { 
    label: 'Administrator', 
    icon: <AdminIcon />, 
    color: '#9c27b0',
    description: 'Vollzugriff auf alle Funktionen des Systems'
  },
  'workflow-designer': { 
    label: 'Workflow-Designer', 
    icon: <SettingsIcon />, 
    color: '#2196f3',
    description: 'Kann Workflows erstellen und bearbeiten'
  },
  approver: { 
    label: 'Genehmiger', 
    icon: <ApproverIcon />, 
    color: '#ff9800',
    description: 'Kann Dokumente in Workflows genehmigen'
  },
  user: { 
    label: 'Benutzer', 
    icon: <UserIcon />, 
    color: '#4caf50',
    description: 'Kann Dokumente hochladen und zugewiesene Aufgaben bearbeiten'
  },
  readonly: { 
    label: 'Nur Lesen', 
    icon: <ReadOnlyIcon />, 
    color: '#757575',
    description: 'Kann nur Dokumente einsehen, zu denen Zugriff gewährt wurde'
  }
};

// Generieren von Dummy-Benutzern
const generateDummyUsers = () => {
  const users = [
    {
      _id: 'admin1',
      username: 'admin',
      email: 'admin@example.com',
      name: 'Administrator',
      role: 'admin',
      department: 'IT',
      active: true,
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date()
    },
    {
      _id: 'designer1',
      username: 'workflowdesigner',
      email: 'designer@example.com',
      name: 'Max Workflow',
      role: 'workflow-designer',
      department: 'Prozessmanagement',
      active: true,
      createdAt: new Date('2023-01-15'),
      lastLogin: new Date('2023-06-10')
    }
  ];
  
  // Weitere Benutzer generieren
  const departments = ['Buchhaltung', 'Vertrieb', 'Personal', 'Einkauf', 'Marketing', 'Kundenservice'];
  const roles = ['approver', 'user', 'readonly'];
  
  for (let i = 1; i <= 30; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365));
    
    const lastLoginDate = new Date();
    lastLoginDate.setDate(lastLoginDate.getDate() - Math.floor(Math.random() * 30));
    
    users.push({
      _id: `user${i}`,
      username: `user${i}`,
      email: `user${i}@example.com`,
      name: `Benutzer ${i}`,
      role,
      department,
      active: Math.random() > 0.1, // 10% inaktive Benutzer
      createdAt: createdDate,
      lastLogin: lastLoginDate
    });
  }
  
  return users;
};

const UserManagement = () => {
  // State für Benutzerliste
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination-State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Such- und Filter-State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Dialog-States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  
  // Ausgewählter Benutzer für Dialoge
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Formular-Daten für neuen Benutzer
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    department: '',
    active: true
  });
  
  // Benutzer laden
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // In einer realen App würden die Benutzer von der API geladen werden
        // const response = await api.get('/api/users');
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyUsers = generateDummyUsers();
          setUsers(dummyUsers);
          setFilteredUsers(dummyUsers);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
        setError('Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Benutzer filtern
  useEffect(() => {
    if (!users.length) return;
    
    let filtered = [...users];
    
    // Textsuche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.department.toLowerCase().includes(searchLower)
      );
    }
    
    // Rollenfilter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Statusfilter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.active);
    }
    
    setFilteredUsers(filtered);
    setPage(0); // Zurück zur ersten Seite bei Filteränderung
  }, [users, searchTerm, roleFilter, statusFilter]);
  
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
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Dialog-Handler
  const handleOpenCreateDialog = () => {
    setFormData({
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      department: '',
      active: true
    });
    setCreateDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };
  
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      active: user.active,
      // Passwort nicht setzen bei Bearbeitung
      password: '',
      confirmPassword: ''
    });
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };
  
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };
  
  const handleOpenResetPasswordDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      password: '',
      confirmPassword: ''
    });
    setResetPasswordDialogOpen(true);
  };
  
  const handleCloseResetPasswordDialog = () => {
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };
  
  // CRUD-Operationen
  const handleCreateUser = () => {
    // Validierung
    if (formData.password !== formData.confirmPassword) {
      alert('Passwörter stimmen nicht überein');
      return;
    }
    
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.post('/api/users', formData);
    
    // Für Demo-Zwecke fügen wir den Benutzer lokal hinzu
    const newUser = {
      _id: `user${Date.now()}`,
      username: formData.username,
      email: formData.email,
      name: formData.name,
      role: formData.role,
      department: formData.department,
      active: formData.active,
      createdAt: new Date(),
      lastLogin: null
    };
    
    setUsers([...users, newUser]);
    handleCloseCreateDialog();
    
    // Erfolgsmeldung
    alert('Benutzer erfolgreich erstellt');
  };
  
  const handleUpdateUser = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/users/${selectedUser._id}`, formData);
    
    // Für Demo-Zwecke aktualisieren wir den Benutzer lokal
    const updatedUsers = users.map(user => {
      if (user._id === selectedUser._id) {
        return {
          ...user,
          username: formData.username,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          active: formData.active
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    handleCloseEditDialog();
    
    // Erfolgsmeldung
    alert('Benutzer erfolgreich aktualisiert');
  };
  
  const handleDeleteUser = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.delete(`/api/users/${selectedUser._id}`);
    
    // Für Demo-Zwecke entfernen wir den Benutzer lokal
    const updatedUsers = users.filter(user => user._id !== selectedUser._id);
    
    setUsers(updatedUsers);
    handleCloseDeleteDialog();
    
    // Erfolgsmeldung
    alert('Benutzer erfolgreich gelöscht');
  };
  
  const handleResetPassword = () => {
    // Validierung
    if (formData.password !== formData.confirmPassword) {
      alert('Passwörter stimmen nicht überein');
      return;
    }
    
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/users/${selectedUser._id}/reset-password`, { password: formData.password });
    
    // Für Demo-Zwecke geben wir nur eine Meldung aus
    alert(`Passwort für Benutzer ${selectedUser.username} wurde zurückgesetzt`);
    
    handleCloseResetPasswordDialog();
  };
  
  const handleToggleUserStatus = (user) => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/users/${user._id}/toggle-status`);
    
    // Für Demo-Zwecke aktualisieren wir den Status lokal
    const updatedUsers = users.map(u => {
      if (u._id === user._id) {
        return {
          ...u,
          active: !u.active
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    
    // Erfolgsmeldung
    alert(`Benutzer ${user.username} wurde ${user.active ? 'deaktiviert' : 'aktiviert'}`);
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
  
  // Rolle als Chip darstellen
  const renderRoleChip = (role) => {
    const roleInfo = userRoles[role] || { label: role, color: '#757575', icon: <UserIcon /> };
    
    return (
      <Chip
        icon={roleInfo.icon}
        label={roleInfo.label}
        size="small"
        sx={{
          backgroundColor: `${roleInfo.color}20`,
          color: roleInfo.color,
          '& .MuiChip-icon': {
            color: roleInfo.color
          }
        }}
      />
    );
  };
  
  // Status als Chip darstellen
  const renderStatusChip = (active) => {
    return (
      <Chip
        icon={active ? <LockOpenIcon /> : <LockIcon />}
        label={active ? 'Aktiv' : 'Inaktiv'}
        size="small"
        color={active ? 'success' : 'default'}
        variant={active ? 'filled' : 'outlined'}
      />
    );
  };
  
  // Paginierte Benutzer
  const paginatedUsers = filteredUsers
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Leere Zeilen für Pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredUsers.length - page * rowsPerPage);
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Benutzerverwaltung</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Neuer Benutzer
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
              <InputLabel>Rolle</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Rolle"
              >
                <MenuItem value="">Alle Rollen</MenuItem>
                {Object.entries(userRoles).map(([key, { label }]) => (
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
                setRoleFilter('');
                setStatusFilter('');
              }}
            >
              Filter zurücksetzen
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Benutzertabelle */}
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
                    <TableCell>Benutzername</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>E-Mail</TableCell>
                    <TableCell>Abteilung</TableCell>
                    <TableCell>Rolle</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Erstellt am</TableCell>
                    <TableCell>Letzter Login</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{renderRoleChip(user.role)}</TableCell>
                      <TableCell>{renderStatusChip(user.active)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Bearbeiten">
                            <IconButton onClick={() => handleOpenEditDialog(user)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Passwort zurücksetzen">
                            <IconButton onClick={() => handleOpenResetPasswordDialog(user)} size="small">
                              <LockOpenIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.active ? 'Deaktivieren' : 'Aktivieren'}>
                            <IconButton 
                              onClick={() => handleToggleUserStatus(user)}
                              size="small"
                              color={user.active ? 'default' : 'primary'}
                            >
                              {user.active ? <LockIcon /> : <LockOpenIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton 
                              onClick={() => handleOpenDeleteDialog(user)} 
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
                  
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <UserIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Keine Benutzer gefunden
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Versuchen Sie, Ihre Suchkriterien anzupassen
                          </Typography>
                          <Button 
                            variant="outlined"
                            onClick={() => {
                              setSearchTerm('');
                              setRoleFilter('');
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
              count={filteredUsers.length}
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
      
      {/* Dialog: Benutzer erstellen */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Benutzername"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
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
                label="E-Mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Abteilung"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Rolle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Rolle"
                >
                  {Object.entries(userRoles).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Passwort"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Passwort bestätigen"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Benutzer ist aktiv"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Rolleninformationen
              </Typography>
              <Box sx={{ pl: 2, pr: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>{userRoles[formData.role]?.label}:</strong> {userRoles[formData.role]?.description}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Abbrechen</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={
              !formData.username || 
              !formData.name || 
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword ||
              formData.password !== formData.confirmPassword
            }
          >
            Benutzer erstellen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Benutzer bearbeiten */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Benutzer bearbeiten</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Benutzername"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
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
                label="E-Mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Abteilung"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Rolle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Rolle"
                >
                  {Object.entries(userRoles).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Benutzer ist aktiv"
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Erstellt am:</strong> {selectedUser && formatDate(selectedUser.createdAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Letzter Login:</strong> {selectedUser && formatDate(selectedUser.lastLogin)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Rolleninformationen
              </Typography>
              <Box sx={{ pl: 2, pr: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>{userRoles[formData.role]?.label}:</strong> {userRoles[formData.role]?.description}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Abbrechen</Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained"
            disabled={
              !formData.username || 
              !formData.name || 
              !formData.email
            }
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Benutzer löschen */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie den Benutzer "{selectedUser?.name}" wirklich löschen?
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Abbrechen</Button>
          <Button onClick={handleDeleteUser} color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Passwort zurücksetzen */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={handleCloseResetPasswordDialog}
      >
        <DialogTitle>Passwort zurücksetzen</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Passwort für Benutzer "{selectedUser?.name}" zurücksetzen:
          </Typography>
          <TextField
            fullWidth
            label="Neues Passwort"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Passwort bestätigen"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetPasswordDialog}>Abbrechen</Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained"
            disabled={
              !formData.password ||
              !formData.confirmPassword ||
              formData.password !== formData.confirmPassword
            }
          >
            Passwort zurücksetzen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
