import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  TextField,
  InputAdornment,
  Avatar,
  Badge
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import MailboxIcon from '@mui/icons-material/Inbox';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import FileUploader from '../components/FileUploader';
import { formatDate, formatFileSize } from '../utils/helpers';

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Constants for layout
const SIDEBAR_WIDTH = 320;
const METADATA_WIDTH = 300;

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
  const [currentDocument, setCurrentDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch documents and mailboxes
  const fetchData = useCallback(async () => {
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
  }, [selectedMailbox]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  const handleDocumentClick = (document) => {
    setCurrentDocument(document);
    setPageNumber(1); // Reset page number when document changes
    setNumPages(null); // Reset page count when document changes
    setPdfLoading(true); // Reset PDF loading state
    setPdfError(false); // Reset PDF error state
  };

  const handleDocumentDetails = (id) => {
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
    setUploadDrawerOpen(false);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDeleteDocument = async (document) => {
    try {
      await axios.delete(`/api/documents/${document._id}`);
      setDeleteConfirm(null);
      if (currentDocument && currentDocument._id === document._id) {
        setCurrentDocument(null);
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Fehler beim Löschen des Dokuments');
    }
  };

  const handleMenuClick = (event, document) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
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

  // PDF functionality
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get file type icon with color
  const getFileIcon = (mimeType) => {
    let color;
    if (mimeType.startsWith('image/')) color = '#4CAF50';
    else if (mimeType === 'application/pdf') color = '#F44336';
    else if (mimeType.includes('word') || mimeType.includes('document')) color = '#2196F3';
    else if (mimeType.includes('excel') || mimeType.includes('sheet')) color = '#4CAF50';
    else color = '#9E9E9E';
    
    return (
      <Avatar
        variant="rounded"
        sx={{
          bgcolor: `${color}20`, // 20% opacity of the color
          color: color,
          width: 40,
          height: 40
        }}
      >
        <InsertDriveFileIcon />
      </Avatar>
    );
  };

  // Render document viewer or placeholder
  const renderDocumentViewer = () => {
    if (!currentDocument) {
      return (
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          <DescriptionIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6">Kein Dokument ausgewählt</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Wählen Sie ein Dokument aus der Liste auf der linken Seite aus.
          </Typography>
        </Box>
      );
    }

    // Verwende korrekte Pfadangabe für API URL
    const API_URL = process.env.NODE_ENV === 'production' 
      ? (process.env.REACT_APP_API_URL || 'http://localhost:4000')
      : `${window.location.protocol}//${window.location.hostname}:4000`;

    const fileUrl = currentDocument.path ? `${API_URL}/${currentDocument.path}` : '';
    
    // PDF Dokumente direkt anzeigen
    if (currentDocument.type === 'application/pdf' && fileUrl) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          p: 2 
        }}>
          <Box sx={{ 
            width: '100%', 
            flexGrow: 1,
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 2,
            bgcolor: 'white',
            position: 'relative'
          }}>
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('Error loading PDF:', error);
                setPdfError(true);
                setPdfLoading(false);
              }}
              loading={
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography>PDF wird geladen...</Typography>
                </Box>
              }
              error={
                <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
                  <Typography>Fehler beim Laden des PDFs.</Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 2 }}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Herunterladen
                  </Button>
                </Box>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={Math.min(800, window.innerWidth - 300)}
              />
            </Document>
          </Box>
          
          {numPages && (
            <Box 
              sx={{ 
                mt: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                bgcolor: 'background.paper',
                p: 1.5, 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Button 
                variant="outlined" 
                disabled={pageNumber <= 1}
                onClick={goToPrevPage}
                startIcon={<NavigateBeforeIcon />}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Vorherige
              </Button>
              <Typography sx={{ mx: 2, fontWeight: 500 }}>
                Seite {pageNumber} von {numPages}
              </Typography>
              <Button 
                variant="outlined" 
                disabled={pageNumber >= numPages}
                onClick={goToNextPage}
                endIcon={<NavigateNextIcon />}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Nächste
              </Button>
            </Box>
          )}
        </Box>
      );
    } 
    // Bilder anzeigen
    else if (currentDocument.type && currentDocument.type.startsWith('image/') && fileUrl) {
      return (
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <img 
            src={fileUrl} 
            alt={currentDocument.name} 
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 140px)', objectFit: 'contain' }} 
          />
        </Box>
      );
    } 
    // Für andere Dateitypen, zeige eine Vorschau-Karte
    else {
      return (
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              width: '100%', 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              {getFileIcon(currentDocument.type || 'application/octet-stream')}
            </Box>
            <Typography variant="h5" gutterBottom>{currentDocument.name}</Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {formatFileSize(currentDocument.size)}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => handleDocumentDetails(currentDocument._id)}
            >
              Dokument öffnen
            </Button>
            {fileUrl && (
              <Button 
                variant="outlined" 
                sx={{ mt: 2, ml: 2 }}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Herunterladen
              </Button>
            )}
          </Paper>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 600, 
              letterSpacing: '0.5px'
            }}
          >
            DMS System
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit"
              variant="outlined"
              onClick={() => setUploadDrawerOpen(true)}
              sx={{ 
                mr: 2,
                borderRadius: 2,
                px: 2,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Dokument hochladen
            </Button>
            
            <Chip
              avatar={
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.dark',
                    color: 'white'
                  }}
                >
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              }
              label={currentUser?.username || 'Benutzer'}
              variant="filled"
              color="primary"
              sx={{ 
                mr: 2,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                '& .MuiChip-label': {
                  color: 'white',
                  px: 1
                }
              }}
            />
            
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
            
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Main content */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexGrow: 1,
          overflow: 'hidden',
          bgcolor: '#f5f7fa'
        }}
      >
        {/* Left sidebar for mailbox selection and document list */}
        <Box 
          sx={{ 
            width: SIDEBAR_WIDTH, 
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            bgcolor: 'background.paper',
            flexShrink: 0
          }}
        >
          {/* Mailbox selection */}
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="mailbox-select-label">Postkorb</InputLabel>
              <Select
                labelId="mailbox-select-label"
                id="mailbox-select"
                value={selectedMailbox}
                label="Postkorb"
                onChange={handleMailboxChange}
              >
                <MenuItem value="">
                  <em>Alle Postkörbe</em>
                </MenuItem>
                {mailboxes.map((mailbox) => (
                  <MenuItem key={mailbox._id} value={mailbox._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MailboxIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                      {mailbox.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Search and filter section */}
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <TextField
              placeholder="Suche nach Dokumenten"
              variant="outlined"
              fullWidth
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={() => setSearchQuery('')}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Chip
                icon={<FilterListIcon fontSize="small" />}
                label="Filter"
                variant="outlined"
                size="small"
                onClick={() => {}}
                sx={{ mr: 1 }}
              />
              <Chip
                icon={<SortIcon fontSize="small" />}
                label="Sortieren"
                variant="outlined"
                size="small"
                onClick={() => {}}
              />
            </Box>
          </Box>
          
          {/* Document list */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              p: 0
            }}
          >
            {uploadSuccess && (
              <Alert severity="success" sx={{ m: 2 }}>
                Dokument erfolgreich hochgeladen
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredDocuments.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Keine Dokumente gefunden
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => setUploadDrawerOpen(true)}
                >
                  Dokument hochladen
                </Button>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredDocuments.map((doc, index) => (
                  <React.Fragment key={doc?._id || index}>
                    {index > 0 && <Divider component="li" variant="middle" />}
                    <ListItem 
                      button
                      selected={currentDocument?._id === doc?._id}
                      onClick={() => handleDocumentClick(doc)}
                      sx={{ 
                        py: 1.5,
                        px: 2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': {
                            bgcolor: 'primary.light',
                          },
                          '& .MuiListItemText-primary, & .MuiListItemText-secondary': {
                            color: 'white'
                          },
                          '& .MuiAvatar-root': {
                            bgcolor: 'white',
                            '& .MuiSvgIcon-root': {
                              color: 'primary.main'
                            }
                          }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 52 }}>
                        {getFileIcon(doc?.type || 'application/octet-stream')}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body1" 
                            component="div" 
                            noWrap 
                            fontWeight={currentDocument?._id === doc?._id ? 600 : 400}
                            sx={{ mb: 0.5 }}
                          >
                            {doc?.name || 'Unbenanntes Dokument'}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                            <Typography
                              variant="caption"
                              component="span"
                              sx={{ fontWeight: 500 }}
                            >
                              {formatFileSize(doc?.size || 0)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="inherit"
                              component="span"
                              sx={{ opacity: 0.8 }}
                            >
                              • {formatDate(doc?.createdAt || new Date())}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="more"
                          onClick={(e) => handleMenuClick(e, doc)}
                          size="small"
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
        
        {/* Center - Document Viewer */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            bgcolor: '#f5f7fa',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Document toolbar */}
          {currentDocument && (
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={500}>
                  {currentDocument.name}
                </Typography>
                {currentDocument?.mailbox && (
                  <Chip
                    size="small"
                    label={typeof currentDocument.mailbox === 'object' 
                      ? currentDocument.mailbox.name 
                      : getMailboxName(currentDocument.mailbox)}
                    sx={{ ml: 2 }}
                    icon={<FolderOpenIcon fontSize="small" />}
                  />
                )}
              </Box>
              <Box>
                <Button 
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => handleDocumentDetails(currentDocument._id)}
                  sx={{ mr: 1 }}
                >
                  Details
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirm(currentDocument)}
                >
                  Löschen
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Document content */}
          <Box sx={{ flexGrow: 1 }}>
            {renderDocumentViewer()}
          </Box>
        </Box>
        
        {/* Right sidebar for metadata (placeholder for future implementation) */}
        <Box 
          sx={{ 
            width: METADATA_WIDTH, 
            p: 2,
            bgcolor: 'background.paper',
            borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Metadaten
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {currentDocument ? (
            <Box>
              <TextField
                label="Rechnungsnummer"
                variant="outlined"
                fullWidth
                size="small"
                placeholder="Noch nicht erfasst"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Datum"
                variant="outlined"
                fullWidth
                size="small"
                placeholder="Noch nicht erfasst"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Betrag"
                variant="outlined"
                fullWidth
                size="small"
                placeholder="Noch nicht erfasst"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Lieferant"
                variant="outlined"
                fullWidth
                size="small"
                placeholder="Noch nicht erfasst"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Notizen"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                placeholder="Notizen zum Dokument"
                sx={{ mb: 2 }}
              />
              <Button 
                variant="contained" 
                color="primary"
                fullWidth
                disabled
              >
                Speichern
              </Button>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ display: 'block', mt: 1, textAlign: 'center' }}
              >
                Metadaten-Funktion in Entwicklung
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Wählen Sie ein Dokument aus, um Metadaten anzuzeigen und zu bearbeiten.
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* File upload drawer */}
      <Drawer
        anchor="right"
        open={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 3
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Dokument hochladen</Typography>
          <IconButton onClick={() => setUploadDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <FileUploader 
          onUploadSuccess={handleUploadSuccess} 
          mailboxes={mailboxes}
          selectedMailbox={selectedMailbox}
        />
      </Drawer>
      
      {/* Document actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedDocument) {
            handleDocumentClick(selectedDocument);
          }
        }}>
          Öffnen
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedDocument) {
            handleDocumentDetails(selectedDocument._id);
          }
        }}>
          Details anzeigen
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
            variant="contained"
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
