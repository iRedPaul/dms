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
  Grid,
  Chip,
  Avatar,
  InputAdornment,
  Stack,
  Divider,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

function MailboxManagement({ onSuccess, onError }) {
  const [mailboxes, setMailboxes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingMailbox, setEditingMailbox] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    
    if (!formData.name || formData.name.trim() === '') {
      onError('Der Name des Postkorbs ist erforderlich');
      return;
    }
    
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

  // Get count of users with access to this mailbox
  const getUsers = (mailboxId) => {
    return users.filter(user => 
      user.mailboxAccess && 
      user.mailboxAccess.some(mb => 
        (typeof mb === 'string' && mb === mailboxId) || 
        (mb._id && mb._id === mailboxId)
      )
    );
  };

  // Filter mailboxes based on search query
  const filteredMailboxes = mailboxes.filter(mailbox =>
    mailbox.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mailbox.description && mailbox.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get a more colorful but predictable color for a mailbox
  const getMailboxColor = (name) => {
    const colors = ['#0063a6', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#009688', '#673ab7'];
    const hashCode = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hashCode % colors.length];
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              Postkorbverwaltung
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Postkörbe erstellen, bearbeiten und verwalten
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMailbox}
              sx={{ 
                borderRadius: 2,
                px: 2
              }}
            >
              Neuer Postkorb
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Postkörbe suchen..."
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
      ) : mailboxes.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 2, p: 3, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="body1">Keine Postkörbe gefunden</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddMailbox}
              sx={{ mt: 2 }}
            >
              Ersten Postkorb erstellen
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
                {!isMobile && <TableCell>Beschreibung</TableCell>}
                <TableCell>Benutzer</TableCell>
                {!isMobile && <TableCell>Erstellt am</TableCell>}
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMailboxes.map((mailbox) => (
                <TableRow key={mailbox._id}>
                  <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{ 
                        bgcolor: `${getMailboxColor(mailbox.name)}20`,
                        color: getMailboxColor(mailbox.name),
                        mr: 2
                      }}
                    >
                      <FolderIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {mailbox.name}
                      </Typography>
                      {isMobile && mailbox.description && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                          {mailbox.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography noWrap sx={{ maxWidth: 250 }}>
                        {mailbox.description || '-'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Tooltip 
                      title={
                        getUserCount(mailbox._id) > 0
                          ? getUsers(mailbox._id).map(user => user.username).join(', ')
                          : 'Keine Benutzer mit Zugriff'
                      }
                    >
                      <Chip
                        icon={<PersonIcon />}
                        label={`${getUserCount(mailbox._id)} Benutzer`}
                        size="small"
                        color={getUserCount(mailbox._id) > 0 ? 'primary' : 'default'}
                        variant={getUserCount(mailbox._id) > 0 ? 'filled' : 'outlined'}
                        sx={{ borderRadius: 2 }}
                      />
                    </Tooltip>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      {new Date(mailbox.createdAt).toLocaleDateString('de-DE')}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit Mailbox Dialog */}
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
            {editingMailbox ? 'Postkorb bearbeiten' : 'Neuen Postkorb erstellen'}
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  autoFocus
                  inputProps={{ maxLength: 50 }} // Limit name length
                  helperText="Name des Postkorbs (z.B. 'Eingangsrechnungen', 'Verträge')"
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
                  helperText="Optionale Beschreibung des Verwendungszwecks"
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
        <DialogTitle>Postkorb löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Postkorb "{editingMailbox?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden und entfernt den Postkorb
            aus allen Benutzerzugriffen.
          </DialogContentText>
          
          {editingMailbox && getUserCount(editingMailbox._id) > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mt: 2 }}
              icon={<PersonIcon />}
            >
              {getUserCount(editingMailbox._id)} Benutzer haben aktuell Zugriff auf diesen Postkorb.
            </Alert>
          )}
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
            onClick={handleDeleteMailbox} 
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MailboxManagement;
