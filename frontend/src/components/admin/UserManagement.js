import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Grid,
  Chip,
  Tooltip,
  Autocomplete,
  InputAdornment,
  Avatar,
  Stack,
  Snackbar,
  Alert,
  Divider,
  useMediaQuery,
  useTheme,
  Card,
  CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function UserManagement({ onSuccess, onError }) {
  const [users, setUsers] = useState([]);
  const [mailboxes, setMailboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false,
    mailboxAccess: []
  });
  
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch users and mailboxes when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, mailboxesRes] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/mailboxes')
        ]);
        
        setUsers(usersRes.data);
        setMailboxes(mailboxesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        onError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [onError]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'isAdmin') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle mailbox selection changes
  const handleMailboxChange = (event, newValue) => {
    setFormData({ ...formData, mailboxAccess: newValue.map(mb => mb._id) });
  };

  // Handle adding/editing user form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Prepare update data (exclude password if empty)
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        // Update existing user
        await axios.put(`/api/users/${editingUser._id}`, updateData);
        onSuccess('Benutzer erfolgreich aktualisiert');
      } else {
        // Create new user
        if (!formData.password) {
          onError('Passwort ist erforderlich');
          return;
        }
        
        // Create new user
        await axios.post('/api/users', formData);
        onSuccess('Benutzer erfolgreich erstellt');
      }
      
      // Refresh user list
      const res = await axios.get('/api/users');
      setUsers(res.data);
      
      // Close dialog and reset form
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      console.error('Error saving user:', err);
      onError(err.response?.data?.msg || 'Fehler beim Speichern des Benutzers');
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (!editingUser) return;
    
    try {
      await axios.delete(`/api/users/${editingUser._id}`);
      
      // Refresh user list
      const res = await axios.get('/api/users');
      setUsers(res.data);
      
      onSuccess('Benutzer erfolgreich gelöscht');
      setOpenDeleteDialog(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      onError(err.response?.data?.msg || 'Fehler beim Löschen des Benutzers');
    }
  };

  // Handle updating user permissions
  const handleUpdatePermissions = async () => {
    if (!editingUser) return;
    
    try {
      await axios.put(`/api/users/${editingUser._id}/mailboxes`, {
        mailboxAccess: formData.mailboxAccess
      });
      
      // Refresh user list
      const res = await axios.get('/api/users');
      setUsers(res.data);
      
      onSuccess('Berechtigungen erfolgreich aktualisiert');
      setOpenPermissionsDialog(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating permissions:', err);
      onError('Fehler beim Aktualisieren der Berechtigungen');
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      isAdmin: false,
      mailboxAccess: []
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  // Open dialog for adding a new user
  const handleAddUser = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Open dialog for editing a user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't send the password unless it's changed
      isAdmin: user.isAdmin,
      mailboxAccess: user.mailboxAccess.map(mb => typeof mb === 'string' ? mb : mb._id)
    });
    setOpenDialog(true);
  };

  // Open dialog for deleting a user
  const handleDeleteDialog = (user) => {
    setEditingUser(user);
    setOpenDeleteDialog(true);
  };

  // Open dialog for editing mailbox permissions
  const handlePermissionsDialog = (user) => {
    setEditingUser(user);
    setFormData({
      ...formData,
      mailboxAccess: user.mailboxAccess.map(mb => typeof mb === 'string' ? mb : mb._id)
    });
    setOpenPermissionsDialog(true);
  };

  // Find mailbox names for user
  const getMailboxNames = (mailboxIds) => {
    if (!mailboxIds || mailboxIds.length === 0) return 'Keine';
    
    const names = mailboxIds.map(mbId => {
      // Handle both object references and plain IDs
      const id = typeof mbId === 'object' ? mbId._id : mbId;
      const mailbox = mailboxes.find(mb => mb._id === id);
      return mailbox ? mailbox.name : 'Unbekannt';
    });
    
    return names.join(', ');
  };

  // Get selected mailboxes as objects for Autocomplete
  const getSelectedMailboxes = () => {
    return formData.mailboxAccess.map(mbId => {
      return mailboxes.find(mb => mb._id === mbId) || { _id: mbId, name: 'Unbekannt' };
    });
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              Benutzerverwaltung
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Benutzer erstellen, bearbeiten und verwalten
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
              sx={{ 
                borderRadius: 2,
                px: 2
              }}
            >
              Neuer Benutzer
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Benutzer suchen..."
          variant="outlined"
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 2, p: 3, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="body1">Keine Benutzer gefunden</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
              sx={{ mt: 2 }}
            >
              Ersten Benutzer erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={0} 
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            // Fix for consistent table borders
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
              padding: '16px',
              fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", sans-serif'
            },
            '& .MuiTableRow-root:last-child .MuiTableCell-body': {
              borderBottom: 'none'
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              fontWeight: 'bold'
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Benutzer</TableCell>
                <TableCell>Rolle</TableCell>
                {!isMobile && <TableCell>Postkörbe</TableCell>}
                {!isMobile && <TableCell>Erstellt am</TableCell>}
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: user.isAdmin ? 'primary.main' : 'grey.200',
                          color: user.isAdmin ? 'white' : 'text.primary',
                          mr: 2,
                          width: 36,
                          height: 36
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {user.username}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            Erstellt: {new Date(user.createdAt).toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Chip 
                        size="small" 
                        color="primary" 
                        label="Administrator" 
                        icon={<AdminPanelSettingsIcon />}
                      />
                    ) : (
                      <Chip 
                        size="small" 
                        variant="outlined" 
                        label="Benutzer" 
                        icon={<PersonOutlineIcon />}
                      />
                    )}
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography 
                        noWrap 
                        title={getMailboxNames(user.mailboxAccess)} 
                        sx={{ maxWidth: { xs: '120px', sm: '200px', md: '300px' } }}
                      >
                        {user.mailboxAccess && user.mailboxAccess.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            <Chip
                              size="small"
                              label={`${user.mailboxAccess.length} Postkorb${user.mailboxAccess.length !== 1 ? 'e' : ''}`}
                              variant="outlined"
                              color="primary"
                            />
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Keine Postkörbe
                          </Typography>
                        )}
                      </Typography>
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('de-DE')}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Berechtigungen">
                        <IconButton
                          size="small"
                          onClick={() => handlePermissionsDialog(user)}
                          color="default"
                        >
                          <LockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Bearbeiten">
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDialog(user)}
                            color="error"
                            disabled={user._id === currentUser.id} // Prevent deleting self
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  name="username"
                  label="Benutzername"
                  value={formData.username}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ maxLength: 30 }}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label={editingUser ? "Passwort (leer lassen, um nicht zu ändern)" : "Passwort"}
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required={!editingUser}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isAdmin"
                      checked={formData.isAdmin}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Administrator-Rechte"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => {
                setOpenDialog(false);
                resetForm();
              }}
              startIcon={<CancelIcon />}
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2 }}
            >
              Speichern
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Benutzer "{editingUser?.username}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Permissions Dialog */}
      <Dialog 
        open={openPermissionsDialog} 
        onClose={() => setOpenPermissionsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          Berechtigungen für {editingUser?.username}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Wählen Sie die Postkörbe aus, auf die dieser Benutzer zugreifen darf:
          </Typography>
          
          <Autocomplete
            multiple
            options={mailboxes}
            getOptionLabel={(option) => option.name}
            value={getSelectedMailboxes()}
            onChange={handleMailboxChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Postkörbe"
                placeholder="Postkörbe auswählen"
                fullWidth
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              ))
            }
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            Hinweis: Benutzer können nur auf Dokumente in den ihnen zugewiesenen Postkörben zugreifen.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setOpenPermissionsDialog(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleUpdatePermissions} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
