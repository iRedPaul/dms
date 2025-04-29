import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
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
  Tabs,
  Tab,
  Badge,
  useMediaQuery,
  useTheme,
  Snackbar,
  Popover
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
import PrintIcon from '@mui/icons-material/Print';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import HighlightIcon from '@mui/icons-material/Highlight';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import FileUploader from '../components/FileUploader';
import { formatDate, formatFileSize } from '../utils/helpers';

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [moveDocumentDialogOpen, setMoveDocumentDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [targetMailbox, setTargetMailbox] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [showMetadata, setShowMetadata] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [highlightMode, setHighlightMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const viewerContainerRef = useRef(null);

  // Calculate optimal sidebar width based on screen size
  const SIDEBAR_WIDTH = isMobile ? '100%' : (isSmallScreen ? 320 : 360);
  const METADATA_WIDTH = isMobile ? '100%' : (isSmallScreen ? 300 : 350);

  // Fetch documents and mailboxes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Only fetch documents for selected mailbox if one is selected
      const mailboxQuery = selectedMailbox ? `?mailboxId=${selectedMailbox}` : '';
      
      // Fetch data in parallel
      const [documentsRes, mailboxesRes] = await Promise.all([
        axios.get(`/api/documents${mailboxQuery}`),
        axios.get('/api/mailboxes')
      ]);
      
      setDocuments(documentsRes.data);
      setMailboxes(mailboxesRes.data);
      
      // Auto-select first mailbox if none selected and there are mailboxes
      if (!selectedMailbox && mailboxesRes.data.length > 0 && !currentUser.isAdmin) {
        setSelectedMailbox(mailboxesRes.data[0]._id);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Adjust PDF scale based on container size
  useEffect(() => {
    const adjustScale = () => {
      if (viewerContainerRef.current && currentDocument) {
        // Base PDF size (A4)
        const BASE_WIDTH = 595;
        const BASE_HEIGHT = 842;
        
        // Container dimensions
        const containerWidth = viewerContainerRef.current.clientWidth - 40; // Subtract padding
        const containerHeight = viewerContainerRef.current.clientHeight - 40;
        
        // Calculate scales
        const widthScale = containerWidth / BASE_WIDTH;
        const heightScale = containerHeight / BASE_HEIGHT;
        
        // Use the smaller scale to fit the entire document
        const newScale = Math.min(widthScale, heightScale);
        
        // Limit to reasonable range
        const limitedScale = Math.min(Math.max(newScale, 0.5), 1.5);
        
        setPdfScale(limitedScale);
      }
    };
    
    adjustScale();
    
    const handleResize = () => {
      adjustScale();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentDocument, viewerContainerRef.current]);

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
  };

  const handleMailboxChange = (event) => {
    setSelectedMailbox(event.target.value);
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    fetchData();
    setUploadDrawerOpen(false);
    setSuccessMessage('Dokument erfolgreich hochgeladen');
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDeleteDocument = async (document) => {
    try {
      await axios.delete(`/api/documents/${document._id}`);
      setDeleteConfirm(null);
      if (currentDocument && currentDocument._id === document._id) {
        setCurrentDocument(null);
      }
      setSuccessMessage('Dokument wurde erfolgreich gelöscht');
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

  // Initialize document move
  const handleMoveDocumentClick = () => {
    handleMenuClose();
    setTargetMailbox('');
    setMoveDocumentDialogOpen(true);
  };

  // Submit the document move
  const handleMoveDocument = async () => {
    if (!targetMailbox || !selectedDocument) return;
    
    try {
      // Create a PUT request to update the document's mailbox
      await axios.put(`/api/documents/${selectedDocument._id}/move`, {
        mailboxId: targetMailbox
      });
      
      setSuccessMessage('Dokument wurde erfolgreich verschoben');
      setMoveDocumentDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error moving document:', err);
      setError('Fehler beim Verschieben des Dokuments');
    }
  };

  // Initialize document rename
  const handleRenameDocumentClick = () => {
    handleMenuClose();
    if (selectedDocument) {
      setNewDocumentName(selectedDocument.name);
      setRenameDialogOpen(true);
    }
  };

  // Submit the document rename
  const handleRenameDocument = async () => {
    if (!newDocumentName || !selectedDocument) return;
    
    try {
      // Create a PUT request to update the document's name
      await axios.put(`/api/documents/${selectedDocument._id}/rename`, {
        name: newDocumentName
      });
      
      setSuccessMessage('Dokument wurde erfolgreich umbenannt');
      setRenameDialogOpen(false);
      
      // Update UI to reflect changes
      if (currentDocument && currentDocument._id === selectedDocument._id) {
        setCurrentDocument({...currentDocument, name: newDocumentName});
      }
      
      fetchData();
    } catch (err) {
      console.error('Error renaming document:', err);
      setError('Fehler beim Umbenennen des Dokuments');
    }
  };

  // PDF functionality
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };
  
  const handleZoomIn = () => {
    setPdfScale(prev => Math.min(prev + 0.1, 2.0));
  };
  
  const handleZoomOut = () => {
    setPdfScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handlePrint = () => {
    if (!currentDocument) return;
    
    // Get base URL
    const API_URL = process.env.NODE_ENV === 'production' 
      ? (process.env.REACT_APP_API_URL || 'https://dms.home-lan.cc')
      : `${window.location.protocol}//${window.location.hostname}:4000`;
    
    const baseUrl = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;
    const fileUrl = currentDocument.path ? `${baseUrl}/${currentDocument.path}` : '';
    
    if (fileUrl) {
      // Open in new window and print
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };
  
  const handleToggleHighlight = () => {
    setHighlightMode(!highlightMode);
  };
  
  const toggleMetadata = () => {
    setShowMetadata(!showMetadata);
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
            Wählen Sie ein Dokument aus der Liste {isMobile ? "oben" : "links"} aus.
          </Typography>
        </Box>
      );
    }

    // Fix: Use proper URL construction for file paths
    const API_URL = process.env.NODE_ENV === 'production' 
      ? (process.env.REACT_APP_API_URL || 'https://dms.home-lan.cc')
      : `${window.location.protocol}//${window.location.hostname}:4000`;
    
    const baseUrl = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;
    const fileUrl = currentDocument.path ? `${baseUrl}/${currentDocument.path}` : '';
    
    // PDF documents
    if (currentDocument.type === 'application/pdf' && fileUrl) {
      return (
        <Box 
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            ref={viewerContainerRef}
            sx={{
              height: 'calc(100% - 60px)',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative',
              bgcolor: '#f5f5f5',
              borderRadius: 2
            }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onError={(error) => {
                console.error('Error loading PDF:', error);
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
                scale={pdfScale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                customTextRenderer={({ str, itemIndex }) => {
                  return (
                    <span
                      style={{ 
                        backgroundColor: highlightMode ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                        cursor: highlightMode ? 'pointer' : 'text'
                      }}
                      className={highlightMode ? 'highlight-text' : ''}
                      onClick={highlightMode ? () => console.log('Text clicked:', str) : undefined}
                    >
                      {str}
                    </span>
                  );
                }}
              />
            </Document>
          </Box>
          
          {/* PDF Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              width: '100%',
              mt: 'auto'
            }}
          >
            <Paper
              elevation={2}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 0.5,
                pl: 2,
                pr: 2,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <IconButton
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                size="small"
                sx={{ mr: 1 }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              
              <Typography sx={{ minWidth: 100, textAlign: 'center' }}>
                {pageNumber} / {numPages || 1}
              </Typography>
              
              <IconButton
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                size="small"
                sx={{ ml: 1, mr: 2 }}
              >
                <NavigateNextIcon />
              </IconButton>
              
              <Divider orientation="vertical" flexItem sx={{ mr: 2 }} />
              
              <IconButton onClick={handleZoomOut} size="small" sx={{ mr: 1 }}>
                <ZoomOutIcon />
              </IconButton>
              
              <Typography sx={{ minWidth: 40, textAlign: 'center' }}>
                {Math.round(pdfScale * 100)}%
              </Typography>
              
              <IconButton onClick={handleZoomIn} size="small" sx={{ ml: 1, mr: 2 }}>
                <ZoomInIcon />
              </IconButton>
              
              <Divider orientation="vertical" flexItem sx={{ mr: 2 }} />
              
              <Tooltip title="Text markieren">
                <IconButton 
                  onClick={handleToggleHighlight} 
                  size="small" 
                  color={highlightMode ? "primary" : "default"}
                  sx={{ mr: 1 }}
                >
                  <HighlightIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Drucken">
                <IconButton onClick={handlePrint} size="small">
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </Paper>
          </Box>
        </Box>
      );
    } 
    // Images
    else if (currentDocument.type && currentDocument.type.startsWith('image/') && fileUrl) {
      return (
        <Box 
          sx={{
            height: '100%',
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: '#f5f5f5',
            p: 2
          }}
        >
          <img 
            src={fileUrl} 
            alt={currentDocument.name} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              console.error('Error loading image:', e);
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlLCBzYW5zLXNlcmlmIiBmaWxsPSIjOTk5OTk5Ij5Bild8sSgIE5PVCBGT1VORDwvdGV4dD48L3N2Zz4=';
            }}
          />
        </Box>
      );
    } 
    // Other file types
    else {
      return (
        <Box 
          sx={{
            height: '100%', 
            width: '100%',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 3
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 500, 
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
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Dokument öffnen
            </Button>
          </Paper>
        </Box>
      );
    }
  };

  // Render document metadata
  const renderMetadata = () => {
    if (!currentDocument) return null;
    
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
          Metadaten
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
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
    );
  };

  const renderMobileView = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Document list panel */}
        <SwipeableDrawer
          anchor="top"
          open={sidebarOpen}
          onClose={toggleSidebar}
          onOpen={toggleSidebar}
          swipeAreaWidth={30}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              height: '70%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="mobile-mailbox-select-label">Postkorb</InputLabel>
              <Select
                labelId="mobile-mailbox-select-label"
                id="mobile-mailbox-select"
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
            />
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
                      onClick={() => { 
                        handleDocumentClick(doc);
                        toggleSidebar(); // Close sidebar after selection on mobile
                      }}
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
          
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)', textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={toggleSidebar}
              startIcon={<CloseIcon />}
              fullWidth
            >
              Schließen
            </Button>
          </Box>
        </SwipeableDrawer>
        
        {/* Document viewer */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          height: sidebarOpen ? '30%' : '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'height 0.3s ease'
        }}>
          {/* Document header */}
          {currentDocument && (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderRadius: 2
              }}
            >
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="subtitle1" noWrap fontWeight={500}>
                  {currentDocument.name}
                </Typography>
                {currentDocument?.mailbox && (
                  <Typography variant="caption" color="text.secondary">
                    {typeof currentDocument.mailbox === 'object' 
                      ? currentDocument.mailbox.name 
                      : getMailboxName(currentDocument.mailbox)}
                  </Typography>
                )}
              </Box>
              <Box>
                <IconButton 
                  size="small" 
                  onClick={() => setDeleteConfirm(currentDocument)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          )}
          
          {/* Document content */}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: 2,
            position: 'relative'
          }}>
            {renderDocumentViewer()}
            
            {/* Toggle sidebar button */}
            {!sidebarOpen && (
              <Button
                variant="contained"
                color="primary"
                onClick={toggleSidebar}
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  minWidth: 0,
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  p: 0,
                  zIndex: 10
                }}
              >
                <DescriptionIcon />
              </Button>
            )}
          </Box>
          
          {/* Metadata drawer */}
          <SwipeableDrawer
            anchor="bottom"
            open={showMetadata}
            onClose={() => setShowMetadata(false)}
            onOpen={() => setShowMetadata(true)}
            swipeAreaWidth={30}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                height: '70%',
                overflow: 'auto',
                padding: 2
              }
            }}
          >
            {renderMetadata()}
          </SwipeableDrawer>
        </Box>
      </Box>
    );
  };

  const renderDesktopView = () => {
    return (
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
            flexShrink: 0,
            overflowY: 'auto'
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
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {/* Document header with tools */}
          {currentDocument && (
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  {getFileIcon(currentDocument.type || 'application/octet-stream')}
                  <Box sx={{ ml: 2, overflow: 'hidden' }}>
                    <Typography variant="h6" noWrap fontWeight={500}>
                      {currentDocument.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {currentDocument?.mailbox && (
                        <Chip
                          size="small"
                          label={typeof currentDocument.mailbox === 'object' 
                            ? currentDocument.mailbox.name 
                            : getMailboxName(currentDocument.mailbox)}
                          sx={{ mr: 1 }}
                          icon={<FolderOpenIcon fontSize="small" />}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Hochgeladen: {formatDate(currentDocument.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box>
                  <Tooltip title="Drucken">
                    <IconButton onClick={handlePrint} size="small" sx={{ ml: 1 }}>
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Umbenennen">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSelectedDocument(currentDocument);
                        handleRenameDocumentClick();
                      }}
                      sx={{ ml: 1 }}
                    >
                      <DriveFileRenameOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Verschieben">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSelectedDocument(currentDocument);
                        handleMoveDocumentClick();
                      }}
                      sx={{ ml: 1 }}
                    >
                      <DriveFileMoveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Löschen">
                    <IconButton 
                      size="small" 
                      onClick={() => setDeleteConfirm(currentDocument)}
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Document content area */}
          <Box sx={{ 
            flexGrow: 1,
            display: 'flex',
            height: 'calc(100% - 80px)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {renderDocumentViewer()}
          </Box>
        </Box>
        
        {/* Right sidebar for metadata */}
        {showMetadata && (
          <Box 
            sx={{ 
              width: METADATA_WIDTH, 
              p: 3,
              bgcolor: 'background.paper',
              borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflow: 'auto'
            }}
          >
            {renderMetadata()}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={1} square>
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
              onClick={() => setUploadDrawerOpen(true)}
              sx={{ 
                mr: 2,
                px: 2,
                display: { xs: 'none', sm: 'flex' },
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
            
            <Tooltip title="Dokument hochladen">
              <IconButton 
                color="inherit" 
                onClick={() => setUploadDrawerOpen(true)}
                sx={{ 
                  mr: 1,
                  display: { xs: 'flex', sm: 'none' }
                }}
              >
                <DescriptionIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Metadaten anzeigen/ausblenden">
              <IconButton 
                color="inherit" 
                onClick={toggleMetadata}
                sx={{ 
                  mr: 1,
                  display: { xs: 'none', md: 'flex' }
                }}
              >
                <TextFieldsIcon />
              </IconButton>
            </Tooltip>
            
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
                display: { xs: 'none', sm: 'flex' },
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
      
      {/* Main content - render appropriate view */}
      {isMobile ? renderMobileView() : renderDesktopView()}
      
      {/* File upload drawer */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            height: isMobile ? '80%' : '100%',
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
          handleRenameDocumentClick();
        }}>
          <DriveFileRenameOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          Umbenennen
        </MenuItem>
        <MenuItem onClick={handleMoveDocumentClick}>
          <DriveFileMoveIcon fontSize="small" sx={{ mr: 1 }} />
          Verschieben
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
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>Dokument löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie das Dokument "{deleteConfirm?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setDeleteConfirm(null)}
          >
            Abbrechen
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => handleDeleteDocument(deleteConfirm)}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Move document dialog */}
      <Dialog
        open={moveDocumentDialogOpen}
        onClose={() => setMoveDocumentDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>Dokument verschieben</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Wählen Sie einen Postkorb, um das Dokument "{selectedDocument?.name}" zu verschieben.
          </DialogContentText>
          
          <FormControl fullWidth>
            <InputLabel>Ziel-Postkorb</InputLabel>
            <Select
              value={targetMailbox}
              label="Ziel-Postkorb"
              onChange={(e) => setTargetMailbox(e.target.value)}
            >
              {mailboxes.map((mailbox) => (
                <MenuItem key={mailbox._id} value={mailbox._id}>
                  {mailbox.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setMoveDocumentDialogOpen(false)}
          >
            Abbrechen
          </Button>
          <Button 
            variant="contained"
            onClick={handleMoveDocument}
            disabled={!targetMailbox}
          >
            Verschieben
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rename document dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>Dokument umbenennen</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Geben Sie einen neuen Namen für das Dokument ein.
          </DialogContentText>
          
          <TextField
            fullWidth
            label="Dokumentname"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setRenameDialogOpen(false)}
          >
            Abbrechen
          </Button>
          <Button 
            variant="contained"
            onClick={handleRenameDocument}
            disabled={!newDocumentName || newDocumentName === selectedDocument?.name}
          >
            Umbenennen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success message snackbar */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export default Dashboard;
