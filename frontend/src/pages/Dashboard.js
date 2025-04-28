import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  Tooltip,
  Card,
  CardHeader,
  Badge,
  Drawer,
  Chip
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import FileUploader from '../components/FileUploader';
import { formatDate, formatFileSize } from '../utils/helpers';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [mailboxes, setMailboxes] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch documents and mailboxes
  const fetchData = async () => {
    setLoading(true);
    try {
      const mailboxQuery = selectedMailbox ? `?mailboxId=${selectedMailbox}` : '';
      const documentsRes = await axios.get(`/api/documents${mailboxQuery}`);
      const mailboxesRes = await axios.get('/api/mailboxes');
      
      setDocuments(documentsRes.data);
      setMailboxes(mailboxesRes.data);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMailbox]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  const handleDocumentClick = (id) => {
    if (id) {
      navigate(`/documents/${id}`);
    }
  };

  const handleMailboxChange = (event) => {
    setSelectedMailbox(event.target.value);
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    fetchData();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDeleteDocument = async (document) => {
    try {
      await axios.delete(`/api/documents/${document._id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Fehler beim Löschen des Dokuments');
    }
  };

  const handleMenuClick = (event, document) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocument(null);
  };

  const getMailboxName = (mailboxId) => {
    if (!mailboxId) return 'Kein Postkorb';
    const mailbox = mailboxes.find(mb => mb._id === mailboxId);
    return mailbox ? mailbox.name : 'Unbekannt';
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <InsertDriveFileIcon sx={{ color: '#4CAF50' }} />;
    } else if (mimeType === 'application/pdf') {
      return <InsertDriveFileIcon sx={{ color: '#F44336' }} />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <InsertDriveFileIcon sx={{ color: '#2196F3' }} />;
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return <InsertDriveFileIcon sx={{ color: '#4CAF50' }} />;
    } else {
      return <InsertDriveFileIcon />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={4}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DMS System
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Hallo, {currentUser?.username || 'Benutzer'}
          </Typography>
          
          {currentUser?.isAdmin && (
            <Tooltip title="Admin Dashboard">
              <IconButton 
                color="inherit" 
                onClick={navigateToAdmin} 
                sx={{ mr: 1 }}
              >
                <AdminPanelSettingsIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Dokument erfolgreich hochgeladen
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: { xs: 2, md: 0 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                Dokument hochladen
              </Typography>
              
              <FormControl sx={{ mb: 3 }}>
                <InputLabel id="mailbox-select-label">Postkorb</InputLabel>
                <Select
                  labelId="mailbox-select-label"
                  id="mailbox-select"
                  value={selectedMailbox}
                  label="Postkorb"
                  onChange={handleMailboxChange}
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Alle Postkörbe</em>
                  </MenuItem>
                  {mailboxes.map((mailbox) => (
                    <MenuItem key={mailbox._id} value={mailbox._id}>
                      {mailbox.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ flexGrow: 1 }}>
                <FileUploader 
                  onUploadSuccess={handleUploadSuccess} 
                  mailboxes={mailboxes}
                  selectedMailbox={selectedMailbox}
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Wählen Sie einen Postkorb aus, um nur Dokumente aus diesem Postkorb anzuzeigen.
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <FolderOpenIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  {selectedMailbox ? getMailboxName(selectedMailbox) : 'Alle Dokumente'}
                </Typography>
                <Box flexGrow={1} />
                <Chip 
                  label={`${documents.length} Dokument${documents.length !== 1 ? 'e' : ''}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : documents.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Keine Dokumente gefunden. Laden Sie ein Dokument hoch, um zu beginnen.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {documents.map((doc, index) => (
                    <React.Fragment key={doc?._id || index}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem 
                        button 
                        onClick={() => handleDocumentClick(doc?._id)}
                        sx={{ 
                          py: 2,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                        disabled={!doc?._id}
                      >
                        <ListItemIcon>
                          {getDocumentIcon(doc?.type || 'application/octet-stream')}
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" component="div">
                              {doc?.name || 'Unbenanntes Dokument'}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                variant="body2"
                                color="text.primary"
                                component="span"
                              >
                                {formatFileSize(doc?.size || 0)}
                              </Typography>
                              {" • "}
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                              >
                                Hochgeladen am {formatDate(doc?.createdAt || new Date())}
                              </Typography>
                              {doc?.mailbox && (
                                <React.Fragment>
                                  {" • "}
                                  <Typography
                                    variant="body2"
                                    color="primary"
                                    component="span"
                                  >
                                    {typeof doc.mailbox === 'object' ? doc.mailbox.name : getMailboxName(doc.mailbox)}
                                  </Typography>
                                </React.Fragment>
                              )}
                            </React.Fragment>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="more"
                            onClick={(e) => handleMenuClick(e, doc)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Document actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedDocument) {
            handleDocumentClick(selectedDocument._id);
          }
        }}>
          Öffnen
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setDeleteConfirm(selectedDocument);
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Löschen
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Dokument löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie das Dokument "{deleteConfirm?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
          <Button 
            color="error" 
            onClick={() => handleDeleteDocument(deleteConfirm)}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
