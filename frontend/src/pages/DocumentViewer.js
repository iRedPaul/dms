import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Skeleton,
  Breadcrumbs,
  Link,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  Tabs,
  Tab,
  TextField,
  Card,
  CardContent,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FolderIcon from '@mui/icons-material/Folder';
import ShareIcon from '@mui/icons-material/Share';
import PrintIcon from '@mui/icons-material/Print';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import HighlightIcon from '@mui/icons-material/Highlight';
import CommentIcon from '@mui/icons-material/Comment';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import SaveIcon from '@mui/icons-material/Save';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { formatDate, formatFileSize } from '../utils/helpers';

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Konstante für Metadata-Panel-Breite
const METADATA_WIDTH = 380; // Breiter für bessere Nutzung des Raums

function DocumentViewer() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [metadataEditable, setMetadataEditable] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [activeTool, setActiveTool] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState(null);
  const [stampMenuAnchor, setStampMenuAnchor] = useState(null);
  
  const pdfContainerRef = useRef(null);
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Korrigierte URL-Verarbeitung für Cloudflare Zero Trust
  const API_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL.replace('/api', '') // Entferne "/api" vom Ende
        : 'https://dms.home-lan.cc')
    : `${window.location.protocol}//${window.location.hostname}:4000`;

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/documents/${id}`);
        setDocument(res.data);
        setError('');
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Fehler beim Laden des Dokuments');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
    
    // Dynamische Anpassung der PDF-Größe basierend auf der Fenstergröße
    const handleResize = () => {
      // Für eine Ansicht ohne scrollen berechnen wir die verfügbare Höhe und Breite
      const viewportWidth = window.innerWidth - METADATA_WIDTH - 80;
      const viewportHeight = window.innerHeight - 180; // Abzug für Header, Toolbar, etc.
      
      // A4 Proportionen: 210mm x 297mm (≈ 1:1.414)
      const idealWidth = 595; // A4 Breite in Punkten
      const idealHeight = 842; // A4 Höhe in Punkten
      
      // Skalierungsfaktoren für Breite und Höhe
      const scaleX = viewportWidth / idealWidth;
      const scaleY = viewportHeight / idealHeight;
      
      // Der kleinere Wert bestimmt die Skalierung, damit die Seite vollständig angezeigt wird
      const newScale = Math.min(scaleX, scaleY, 1.2); // Max-Skalierung begrenzen
      
      setPdfScale(Math.max(newScale, 0.7)); // Minimum-Skalierung sicherstellen
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial beim Laden
    
    return () => window.removeEventListener('resize', handleResize);
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
  };

  const goBack = () => {
    navigate('/');
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const handleDeleteDocument = async () => {
    try {
      await axios.delete(`/api/documents/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Fehler beim Löschen des Dokuments');
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const toggleEditMode = () => {
    setMetadataEditable(!metadataEditable);
  };
  
  // Annotations-Funktionalität
  const handleSelectTool = (tool) => {
    setActiveTool(activeTool === tool ? null : tool);
    setToolsMenuAnchor(null);
  };

  const handleAddAnnotation = (event, type) => {
    if (!pdfContainerRef.current) return;
    
    // Berechne die Position relativ zum PDF-Container
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const stampType = type === 'stamp' ? 'approved' : null;
    
    const newAnnotation = {
      id: Date.now(),
      type,
      pageNumber,
      x,
      y,
      stampType,
      content: type === 'highlight' ? 'Hervorgehobener Text' : 
              type === 'comment' ? 'Neue Bemerkung' : 
              type === 'bookmark' ? 'Lesezeichen' : `Stempel: ${stampType}`
    };
    
    setAnnotations([...annotations, newAnnotation]);
    setStampMenuAnchor(null);
  };
  
  const openToolsMenu = (event) => {
    setToolsMenuAnchor(event.currentTarget);
  };
  
  const closeToolsMenu = () => {
    setToolsMenuAnchor(null);
  };
  
  const openStampMenu = (event) => {
    setStampMenuAnchor(event.currentTarget);
    setToolsMenuAnchor(null);
    setActiveTool('stamp');
  };
  
  const closeStampMenu = () => {
    setStampMenuAnchor(null);
  };

  // Helper function to get document type icon
  const getDocumentTypeIcon = (mimeType) => {
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
          width: 60,
          height: 60
        }}
      >
        <InsertDriveFileIcon fontSize="large" />
      </Avatar>
    );
  };

  const renderDocumentContent = () => {
    if (!document) return null;

    // Ensure we have a valid file URL string - FIXED PATH CONSTRUCTION
    const fileUrl = document.path ? `${API_URL}/${document.path}` : '';

    // Check if document is PDF
    if (document.type === 'application/pdf' && fileUrl) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          height: '100%',
          p: 2,
          bgcolor: '#f5f7fa',
          borderRadius: 2,
          overflow: 'auto'
        }}>
          {/* PDF Annotations Toolbar */}
          <Paper 
            elevation={1} 
            sx={{ 
              mb: 2, 
              p: 1, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper',
              width: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Tooltip title="Werkzeuge">
                <IconButton 
                  onClick={openToolsMenu}
                  color={activeTool ? 'primary' : 'default'}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Markieren">
                <IconButton 
                  onClick={() => handleSelectTool('highlight')} 
                  color={activeTool === 'highlight' ? 'primary' : 'default'}
                >
                  <HighlightIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Kommentar">
                <IconButton 
                  onClick={() => handleSelectTool('comment')} 
                  color={activeTool === 'comment' ? 'primary' : 'default'}
                >
                  <CommentIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Stempel">
                <IconButton 
                  onClick={openStampMenu}
                  color={activeTool === 'stamp' ? 'primary' : 'default'}
                >
                  <BorderColorIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Lesezeichen">
                <IconButton 
                  onClick={() => handleSelectTool('bookmark')} 
                  color={activeTool === 'bookmark' ? 'primary' : 'default'}
                >
                  <BookmarkIcon />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              
              <Tooltip title="Vorherige Seite">
                <span>
                  <IconButton 
                    disabled={pageNumber <= 1}
                    onClick={goToPrevPage}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Typography sx={{ mx: 1, fontWeight: 500, minWidth: 80, textAlign: 'center' }}>
                {pageNumber} / {numPages || '?'}
              </Typography>
              
              <Tooltip title="Nächste Seite">
                <span>
                  <IconButton 
                    disabled={pageNumber >= numPages}
                    onClick={goToNextPage}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <Tooltip title="Annotationen speichern">
              <IconButton disabled>
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Paper>
          
          {pdfLoading && (
            <Skeleton 
              variant="rectangular" 
              width={595 * pdfScale} 
              height={842 * pdfScale}
              animation="wave"
              sx={{ borderRadius: 2 }}
            />
          )}
          
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex', 
            justifyContent: 'center',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 2,
            bgcolor: 'white',
            position: 'relative'
          }}
            ref={pdfContainerRef}
            // PDF-Annotation-Handling
            onClick={(e) => {
              if (activeTool) {
                handleAddAnnotation(e, activeTool);
                
                // Deaktiviere Tool nach Verwendung bei Kommentaren und Lesezeichen
                if (activeTool === 'comment' || activeTool === 'bookmark') {
                  setActiveTool(null);
                }
              }
            }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('Error loading PDF:', error);
                setPdfError(true);
                setPdfLoading(false);
              }}
              loading={null}
              error={null}
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@2.12.313/cmaps/',
                cMapPacked: true,
              }}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true} // Aktiviert Textebene für Textauswahl
                renderAnnotationLayer={true} // Aktiviert Annotationsebene
                customTextRenderer={({ str, itemIndex }) => {
                  // Erlaube Textauswahl (mit Hilfe von react-pdf)
                  return str;
                }}
                width={595 * pdfScale} // A4 Breite mit Skalierung
                height={842 * pdfScale} // A4 Höhe mit Skalierung
                scale={1.0}
                error={null}
              />
              
              {/* Render Annotations */}
              {annotations
                .filter(ann => ann.pageNumber === pageNumber)
                .map(annotation => (
                  <div 
                    key={annotation.id}
                    style={{
                      position: 'absolute',
                      left: annotation.x - 12,
                      top: annotation.y - 12,
                      zIndex: 1000
                    }}
                  >
                    {annotation.type === 'highlight' && (
                      <HighlightIcon color="warning" />
                    )}
                    {annotation.type === 'comment' && (
                      <CommentIcon color="primary" />
                    )}
                    {annotation.type === 'stamp' && (
                      <div style={{ 
                        padding: '4px 8px', 
                        background: 'rgba(244, 67, 54, 0.1)', 
                        border: '1px solid #F44336',
                        borderRadius: '4px',
                        color: '#F44336',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        transform: 'rotate(-15deg)'
                      }}>
                        {annotation.stampType === 'approved' ? 'GENEHMIGT' : 
                         annotation.stampType === 'rejected' ? 'ABGELEHNT' : 
                         annotation.stampType === 'draft' ? 'ENTWURF' : 
                         annotation.stampType === 'received' ? 'ERHALTEN' : 'STEMPEL'}
                      </div>
                    )}
                    {annotation.type === 'bookmark' && (
                      <BookmarkIcon color="success" />
                    )}
                  </div>
                ))
              }
            </Document>
          </Box>
          
          {pdfError && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              Fehler beim Laden des PDFs. Bitte versuchen Sie, die Datei herunterzuladen.
            </Alert>
          )}
        </Box>
      );
    } else if (document.type && document.type.startsWith('image/') && fileUrl) {
      // If document is an image
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center', 
          height: '100%',
          p: 2,
          bgcolor: '#f5f7fa',
          borderRadius: 2
        }}>
          <Box sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'white',
            p: 1,
            textAlign: 'center'
          }}>
            <img 
              src={fileUrl} 
              alt={document.name || 'Document'} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: 'calc(100vh - 160px)',
                objectFit: 'contain',
                borderRadius: '4px'
              }} 
              onError={() => setError('Fehler beim Laden des Bildes')}
            />
          </Box>
        </Box>
      );
    } else {
      // For other file types
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center', 
          height: '100%',
          p: 4,
          textAlign: 'center'
        }}>
          <Card 
            elevation={3} 
            sx={{ 
              maxWidth: 500, 
              borderRadius: 3,
              p: 2,
              mb: 4
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                {getDocumentTypeIcon(document.type || 'application/octet-stream')}
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={500}>
                {document.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Dieser Dateityp kann nicht direkt angezeigt werden
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {document.type || 'Unbekannter Dateityp'}
              </Typography>
            </CardContent>
          </Card>
          
          {fileUrl && (
            <Button 
              variant="contained" 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              startIcon={<FileDownloadIcon />}
              sx={{ borderRadius: 2, px: 3, py: 1.2 }}
            >
              Datei herunterladen
            </Button>
          )}
        </Box>
      );
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Button 
            color="inherit" 
            onClick={goBack} 
            startIcon={<ArrowBackIcon />}
            sx={{ 
              mr: 2,
              borderRadius: 2,
              px: 2,
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            Zurück
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {document ? document.name : 'Dokument anzeigen'}
          </Typography>
          
          {document && (
            <Box>
              <Tooltip title="Drucken">
                <IconButton color="inherit" onClick={() => window.print()}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Teilen">
                <IconButton color="inherit">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Informationen">
                <IconButton 
                  color="inherit"
                  onClick={() => setInfoDrawerOpen(true)}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Herunterladen">
                <IconButton 
                  color="inherit" 
                  href={document.path ? `${API_URL}/${document.path}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Löschen">
                <IconButton 
                  color="inherit" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Breadcrumbs bar */}
      <Box 
        sx={{ 
          px: 3, 
          py: 1, 
          bgcolor: 'background.paper', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            underline="hover" 
            color="inherit" 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} />
            Dokumente
          </Link>
          {document?.mailbox && (
            <Link
              underline="hover"
              color="inherit"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <FolderIcon fontSize="small" sx={{ mr: 0.5 }} />
              {typeof document.mailbox === 'object' ? document.mailbox.name : 'Postkorb'}
            </Link>
          )}
          {document && (
            <Typography color="text.primary" sx={{ 
              maxWidth: 400, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {document.name}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>
      
      {/* Main content with metadata panel */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'hidden',
        display: 'flex'
      }}>
        {/* Document content */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {error && (
            <Alert severity="error" sx={{ m: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : document ? (
            <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              {renderDocumentContent()}
            </Box>
          ) : (
            <Box sx={{ 
              p: 3, 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2, maxWidth: 500 }}>
                <Box sx={{ mb: 2, color: 'text.secondary' }}>
                  <DescriptionIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Dokument nicht gefunden
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Das angeforderte Dokument existiert nicht oder Sie haben keine Zugriffsberechtigung.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={goBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Zurück zur Übersicht
                </Button>
              </Paper>
            </Box>
          )}
        </Box>
        
        {/* Right metadata panel - now directly integrated into the main view */}
        {document && (
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
        )}
      </Box>
      
      {/* Tools Menu */}
      <Menu
        anchorEl={toolsMenuAnchor}
        open={Boolean(toolsMenuAnchor)}
        onClose={closeToolsMenu}
      >
        <MenuItem onClick={() => handleSelectTool('highlight')}>
          <ListItemIcon>
            <HighlightIcon fontSize="small" color={activeTool === 'highlight' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Text markieren" />
        </MenuItem>
        <MenuItem onClick={() => handleSelectTool('comment')}>
          <ListItemIcon>
            <CommentIcon fontSize="small" color={activeTool === 'comment' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Kommentar hinzufügen" />
        </MenuItem>
        <MenuItem onClick={openStampMenu}>
          <ListItemIcon>
            <BorderColorIcon fontSize="small" color={activeTool === 'stamp' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Stempel hinzufügen" />
        </MenuItem>
        <MenuItem onClick={() => handleSelectTool('bookmark')}>
          <ListItemIcon>
            <BookmarkIcon fontSize="small" color={activeTool === 'bookmark' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Lesezeichen setzen" />
        </MenuItem>
      </Menu>
      
      {/* Stamps Menu */}
      <Menu
        anchorEl={stampMenuAnchor}
        open={Boolean(stampMenuAnchor)}
        onClose={closeStampMenu}
      >
        <MenuItem onClick={(e) => {
          closeStampMenu();
          const newAnnotation = {
            id: Date.now(),
            type: 'stamp',
            pageNumber,
            x: 200,
            y: 200,
            stampType: 'approved',
            content: 'Stempel: GENEHMIGT'
          };
          setAnnotations([...annotations, newAnnotation]);
        }}>
          <ListItemText 
            primary={
              <Box sx={{ 
                p: '4px 8px', 
                borderRadius: '4px',
                color: '#4CAF50',
                fontWeight: 'bold',
                border: '1px solid #4CAF50',
                display: 'inline-block'
              }}>
                GENEHMIGT
              </Box>
            }
          />
        </MenuItem>
        <MenuItem onClick={(e) => {
          closeStampMenu();
          const newAnnotation = {
            id: Date.now(),
            type: 'stamp',
            pageNumber,
            x: 200,
            y: 200,
            stampType: 'rejected',
            content: 'Stempel: ABGELEHNT'
          };
          setAnnotations([...annotations, newAnnotation]);
        }}>
          <ListItemText 
            primary={
              <Box sx={{ 
                p: '4px 8px', 
                borderRadius: '4px',
                color: '#F44336',
                fontWeight: 'bold',
                border: '1px solid #F44336',
                display: 'inline-block'
              }}>
                ABGELEHNT
              </Box>
            }
          />
        </MenuItem>
        <MenuItem onClick={(e) => {
          closeStampMenu();
          const newAnnotation = {
            id: Date.now(),
            type: 'stamp',
            pageNumber,
            x: 200,
            y: 200,
            stampType: 'draft',
            content: 'Stempel: ENTWURF'
          };
          setAnnotations([...annotations, newAnnotation]);
        }}>
          <ListItemText 
            primary={
              <Box sx={{ 
                p: '4px 8px', 
                borderRadius: '4px',
                color: '#FF9800',
                fontWeight: 'bold',
                border: '1px solid #FF9800',
                display: 'inline-block'
              }}>
                ENTWURF
              </Box>
            }
          />
        </MenuItem>
        <MenuItem onClick={(e) => {
          closeStampMenu();
          const newAnnotation = {
            id: Date.now(),
            type: 'stamp',
            pageNumber,
            x: 200,
            y: 200,
            stampType: 'received',
            content: 'Stempel: ERHALTEN'
          };
          setAnnotations([...annotations, newAnnotation]);
        }}>
          <ListItemText 
            primary={
              <Box sx={{ 
                p: '4px 8px', 
                borderRadius: '4px',
                color: '#2196F3',
                fontWeight: 'bold',
                border: '1px solid #2196F3',
                display: 'inline-block'
              }}>
                ERHALTEN
              </Box>
            }
          />
        </MenuItem>
      </Menu>
      
      {/* Document Info Drawer */}
      <Drawer
        anchor="right"
        open={infoDrawerOpen}
        onClose={() => setInfoDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 420 },
            p: 0
          }
        }}
      >
        {document && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Dokument-Informationen</Typography>
              <IconButton onClick={() => setInfoDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={handleTabChange} aria-label="document info tabs">
                <Tab label="Details" />
                <Tab label="Metadaten" />
              </Tabs>
            </Box>
            
            {/* Tab panels */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
              {/* Details tab */}
              {currentTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    {getDocumentTypeIcon(document.type || 'application/octet-stream')}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h6" noWrap sx={{ 
                        maxWidth: 300,
                        fontWeight: 500
                      }}>
                        {document.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(document.size)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" sx={{ width: '40%', fontWeight: 500 }}>
                            Dateityp
                          </TableCell>
                          <TableCell>
                            {document.type || 'Unbekannt'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 500 }}>
                            Hochgeladen am
                          </TableCell>
                          <TableCell>
                            {formatDate(document.createdAt)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 500 }}>
                            Hochgeladen von
                          </TableCell>
                          <TableCell>
                            {document.uploadedBy && typeof document.uploadedBy === 'object'
                              ? document.uploadedBy.username
                              : 'Unbekannt'
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 500 }}>
                            Postkorb
                          </TableCell>
                          <TableCell>
                            {document.mailbox 
                              ? (typeof document.mailbox === 'object' ? document.mailbox.name : 'Postkorb')
                              : 'Kein Postkorb'
                            }
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    fullWidth
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    Dokument löschen
                  </Button>
                </Box>
              )}
              
              {/* Metadata tab */}
              {currentTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Dokument-Metadaten
                    </Typography>
                    <Button 
                      startIcon={metadataEditable ? null : <EditIcon />}
                      endIcon={metadataEditable ? <CloseIcon /> : null}
                      variant={metadataEditable ? "outlined" : "text"}
                      color={metadataEditable ? "inherit" : "primary"}
                      size="small"
                      onClick={toggleEditMode}
                    >
                      {metadataEditable ? 'Abbrechen' : 'Bearbeiten'}
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <TextField
                    label="Rechnungsnummer"
                    variant="outlined"
                    fullWidth
                    size="small"
                    placeholder="Noch nicht erfasst"
                    sx={{ mb: 2 }}
                    disabled={!metadataEditable}
                  />
                  <TextField
                    label="Datum"
                    variant="outlined"
                    fullWidth
                    size="small"
                    placeholder="Noch nicht erfasst"
                    sx={{ mb: 2 }}
                    disabled={!metadataEditable}
                  />
                  <TextField
                    label="Betrag"
                    variant="outlined"
                    fullWidth
                    size="small"
                    placeholder="Noch nicht erfasst"
                    sx={{ mb: 2 }}
                    disabled={!metadataEditable}
                  />
                  <TextField
                    label="Lieferant"
                    variant="outlined"
                    fullWidth
                    size="small"
                    placeholder="Noch nicht erfasst"
                    sx={{ mb: 2 }}
                    disabled={!metadataEditable}
                  />
                  <TextField
                    label="Notizen"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Notizen zum Dokument"
                    sx={{ mb: 2 }}
                    disabled={!metadataEditable}
                  />
                  
                  {metadataEditable && (
                    <Button 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={toggleEditMode}
                    >
                      Speichern
                    </Button>
                  )}
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ display: 'block', mt: 2, textAlign: 'center' }}
                  >
                    Metadaten-Funktion in Entwicklung
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle>Dokument löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie das Dokument "{document?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleDeleteDocument} 
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

export default DocumentViewer;
