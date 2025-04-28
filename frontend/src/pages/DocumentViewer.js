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
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function DocumentViewer() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  
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

  const renderDocumentContent = () => {
    if (!document) return null;

    // Ensure we have a valid file URL string
    const fileUrl = document.path ? `${API_URL}/${document.path}` : '';
    console.log('Loading document from:', fileUrl);

    // Check if document is PDF
    if (document.type === 'application/pdf' && fileUrl) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<CircularProgress />}
            error={<Alert severity="error">Fehler beim Laden des PDFs</Alert>}
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
            />
          </Document>
          
          {numPages && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                disabled={pageNumber <= 1}
                onClick={goToPrevPage}
              >
                Vorherige
              </Button>
              <Typography>
                Seite {pageNumber} von {numPages}
              </Typography>
              <Button 
                variant="contained" 
                disabled={pageNumber >= numPages}
                onClick={goToNextPage}
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
            style={{ maxWidth: '100%', maxHeight: '70vh' }} 
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
      <AppBar position="static">
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
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            renderDocumentContent()
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default DocumentViewer;
