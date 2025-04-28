import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Skeleton,
  Breadcrumbs,
  Link,
  Tooltip,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FolderIcon from '@mui/icons-material/Folder';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { formatDate, formatFileSize } from '../utils/helpers';

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function DocumentViewer() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Dynamic API URL based on environment with type safety
  const API_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_API_URL || 'http://localhost:4000')
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

  const renderDocumentContent = () => {
    if (!document) return null;

    // Ensure we have a valid file URL string
    const fileUrl = document.path ? `${API_URL}/${document.path}` : '';
    console.log('Loading document from:', fileUrl);

    // Check if document is PDF
    if (document.type === 'application/pdf' && fileUrl) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {pdfLoading && (
            <Skeleton 
              variant="rectangular" 
              width={Math.min(600, window.innerWidth - 50)} 
              height={800}
              animation="wave"
            />
          )}
          
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
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={Math.min(600, window.innerWidth - 50)}
              error={null}
            />
          </Document>
          
          {pdfError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Fehler beim Laden des PDFs. Bitte versuchen Sie, die Datei herunterzuladen.
            </Alert>
          )}
          
          {numPages && (
            <Box 
              sx={{ 
                mt: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                bgcolor: 'background.paper',
                p: 1, 
                borderRadius: 2,
                boxShadow: 1
              }}
            >
              <Button 
                variant="outlined" 
                disabled={pageNumber <= 1}
                onClick={goToPrevPage}
                startIcon={<NavigateBeforeIcon />}
                size="small"
              >
                Vorherige
              </Button>
              <Typography>
                Seite {pageNumber} von {numPages}
              </Typography>
              <Button 
                variant="outlined" 
                disabled={pageNumber >= numPages}
                onClick={goToNextPage}
                endIcon={<NavigateNextIcon />}
                size="small"
              >
                Nächste
              </Button>
            </Box>
          )}
        </Box>
      );
    } else if (document.type && document.type.startsWith('image/') && fileUrl) {
      // If document is an image
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <img 
            src={fileUrl} 
            alt={document.name || 'Document'} 
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} 
            onError={() => setError('Fehler beim Laden des Bildes')}
          />
        </Box>
      );
    } else {
      // For other file types
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            Dieser Dateityp kann nicht direkt angezeigt werden.
          </Typography>
          {fileUrl && (
            <Button 
              variant="contained" 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              startIcon={<FileDownloadIcon />}
            >
              Datei herunterladen
            </Button>
          )}
        </Box>
      );
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={3}>
        <Toolbar>
          <Button 
            color="inherit" 
            onClick={goBack} 
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {document ? document.name : 'Dokument anzeigen'}
          </Typography>
          
          {document && (
            <React.Fragment>
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
            </React.Fragment>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          </Paper>
        ) : document ? (
          <React.Fragment>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Breadcrumbs aria-label="breadcrumb">
                <Link 
                  underline="hover" 
                  color="inherit" 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                >
                  Dokumente
                </Link>
                {document.mailbox && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                    <Typography color="text.primary">
                      {typeof document.mailbox === 'object' ? document.mailbox.name : 'Postkorb'}
                    </Typography>
                  </Box>
                )}
                <Typography color="text.primary">{document.name}</Typography>
              </Breadcrumbs>
            </Paper>
            
            <Grid container spacing={3}>
              <Grid item xs={12} lg={9}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  {renderDocumentContent()}
                </Paper>
              </Grid>
              
              <Grid item xs={12} lg={3}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Dokument-Informationen
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dateiname
                    </Typography>
                    <Typography variant="body1" gutterBottom noWrap title={document.name}>
                      {document.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dateigröße
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatFileSize(document.size)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dateityp
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {document.type}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Postkorb
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {document.mailbox 
                        ? (typeof document.mailbox === 'object' ? document.mailbox.name : 'Postkorb')
                        : 'Kein Postkorb'
                      }
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hochgeladen von
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {document.uploadedBy && typeof document.uploadedBy === 'object'
                        ? document.uploadedBy.username
                        : 'Unbekannt'
                      }
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hochgeladen am
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(document.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Dokument löschen
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </React.Fragment>
        ) : (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography>Dokument nicht gefunden</Typography>
          </Paper>
        )}
      </Container>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Dokument löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie das Dokument "{document?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteDocument} color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DocumentViewer;
