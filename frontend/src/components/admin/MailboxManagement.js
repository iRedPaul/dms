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
  CircularProgress,
  Tooltip,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FolderIcon from '@mui/icons-material/Folder';
import axios from 'axios';

function MailboxManagement({ onSuccess, onError }) {
  const [mailboxes, setMailboxes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingMailbox, setEditingMailbox] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch mailboxes when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mailboxesRes, usersRes] = await Promise.all([
          axios.get('/api/mailboxes'),
          axios.get('/api/users')
        ]);
        
        setMailboxes(mailboxesRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Error fetching mailboxes:', err);
        onError('Fehler beim Laden der Postkörbe');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [onError]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle adding/editing mailbox form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingMailbox) {
        // Update existing mailbox
        await axios.put(`/api/mailboxes/${editingMailbox._id}`, formData);
        onSuccess('Postkorb erfolgreich aktualisiert');
      } else {
        // Create new mailbox
        await axios.post('/api/mailboxes', formData);
        onSuccess('Postkorb erfolgreich erstellt');
      }
      
      // Refresh mailbox list
      const res = await axios.get('/api/mailboxes');
      setMailboxes(res.data);
      
      // Close dialog and reset form
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      console.error('Error saving mailbox:', err);
      onError('Fehler beim Speichern des Postkorbs');
    }
  };

  // Handle deleting a mailbox
  const handleDeleteMailbox = async () => {
    if (!editingMailbox) return;
    
    try {
      await axios.delete(`/api/mailboxes/${editingMailbox._id}`);
      
      // Refresh mailbox list
      const res = await axios.get('/api/mailboxes');
      setMailboxes(res.data);
      
      onSuccess('Postkorb erfolgreich gelöscht');
      setOpenDeleteDialog(false);
      setEditingMailbox(null);
    } catch (err) {
      console.error('Error deleting mailbox:', err);
      onError(err.response?.data?.msg || 'Fehler beim Löschen des Postkorbs');
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingMailbox(null);
  };

  // Open dialog for adding a new mailbox
  const handleAddMailbox = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Open dialog for editing a mailbox
  const handleEditMailbox = (mailbox) => {
    setEditingMailbox(mailbox);
    setFormData({
      name: mailbox.name,
      description: mailbox.description || ''
    });
    setOpenDialog(true);
  };

  // Open dialog for deleting a mailbox
  const handleDeleteDialog = (mailbox) => {
    setEditingMailbox(mailbox);
    setOpenDeleteDialog(true);
  };

  // Get count of users with access to this mailbox
  const getUserCount = (mailboxId) => {
    return users.filter(user => 
      user.mailboxAccess && 
      user.mailboxAccess.some(mb => 
        (typeof mb === 'string' && mb === mailboxId) || 
        (mb._id && mb._id === mailboxId)
      )
    ).length;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Postkorbverwaltung
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddMailbox}
        >
          Neuer Postkorb
        </Button>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : mailboxes.length === 0 ? (
        <Typography variant="body1">Keine Postkörbe gefunden</Typography>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={1} 
          sx={{ 
            borderRadius: 1,
            // Fix for consistent table borders
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
              padding: '16px'
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
                <TableCell>Name</TableCell>
                <TableCell>Beschreibung</TableCell>
                <TableCell>Benutzer mit Zugriff</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mailboxes.map((mailbox) => (
                <TableRow key={mailbox._id}>
                  <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon color="primary" sx={{ mr: 1, opacity: 0.7 }} />
                    {mailbox.name}
                  </TableCell>
                  <TableCell>
                    {/* Add text truncation for long descriptions */}
                    <Typography noWrap sx={{ maxWidth: 250 }}>
                      {mailbox.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getUserCount(mailbox._id)}</TableCell>
                  <TableCell>
                    {new Date(mailbox.createdAt).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Bearbeiten">
                      <IconButton
                        size="small"
                        onClick={() => handleEditMailbox(mailbox)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDialog(mailbox)}
                        color="error"
                        sx={{ ml: 1 }}
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
      
      {/* Add/Edit Mailbox Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingMailbox ? 'Postkorb bearbeiten' : 'Neuen Postkorb erstellen'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ maxLength: 50 }} // Limit name length
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Beschreibung"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 500 }} // Limit description length
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
        <DialogTitle>Postkorb löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Postkorb "{editingMailbox?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden und entfernt den Postkorb
            aus allen Benutzerzugriffen.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteMailbox} color="error">Löschen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MailboxManagement;
