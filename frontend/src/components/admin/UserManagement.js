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
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
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
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false,
    mailboxAccess: []
  });
  
  const { currentUser } = useAuth();

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Benutzerverwaltung
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Neuer Benutzer
        </Button>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Typography variant="body1">Keine Benutzer gefunden</Typography>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={1} 
          sx={{ 
            borderRadius: 1,
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
                <TableCell>Benutzername</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Postkörbe</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Chip size="small" color="primary" label="Admin" />
                    ) : (
                      <Chip size="small" variant="outlined" label="Benutzer" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography noWrap title={getMailboxNames(user.mailboxAccess)} sx={{ maxWidth: { xs: '120px', sm: '200px', md: '300px' } }}>
                      {getMailboxNames(user.mailboxAccess)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell align="right">
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
                        sx={{ ml: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDialog(user)}
                        color="error"
                        sx={{ ml: 1 }}
                        disabled={user._id === currentUser.id} // Prevent deleting self
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="username"
                  label="Benutzername"
                  value={formData.username}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ maxLength: 30 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label={editingUser ? "Passwort (leer lassen, um nicht zu ändern)" : "Passwort"}
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required={!editingUser}
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
                  label="Admin-Rechte"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => {
                setOpenDialog(false);
                resetForm();
              }}
              startIcon={<CancelIcon />}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              Speichern
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Benutzer "{editingUser?.username}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteUser} color="error">Löschen</Button>
        </DialogActions>
      </Dialog>
      
      {/* Permissions Dialog */}
      <Dialog 
        open={openPermissionsDialog} 
        onClose={() => setOpenPermissionsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Berechtigungen für {editingUser?.username}
        </DialogTitle>
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
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionsDialog(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleUpdatePermissions} 
            variant="contained" 
            color="primary"
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
