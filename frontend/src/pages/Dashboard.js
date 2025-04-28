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
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import FileUploader from '../components/FileUploader';
import { formatDate, formatFileSize } from '../utils/helpers';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/documents');
      
      // Ensure we got a proper array of documents
      if (Array.isArray(res.data)) {
        setDocuments(res.data);
        setError('');
      } else {
        console.error('Invalid document data format:', res.data);
        setDocuments([]);
        setError('Fehler beim Laden der Dokumente: Ungültiges Datenformat');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDocumentClick = (id) => {
    if (id) {
      navigate(`/documents/${id}`);
    }
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    fetchDocuments();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DMS System
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Hallo, {currentUser?.username || 'Benutzer'}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Dokument erfolgreich hochgeladen
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Dokument hochladen
          </Typography>
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </Paper>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Meine Dokumente
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
              Keine Dokumente gefunden. Laden Sie ein Dokument hoch, um zu beginnen.
            </Typography>
          ) : (
            <List>
              {documents.map((doc, index) => (
                <React.Fragment key={doc?._id || index}>
                  {index > 0 && <Divider />}
                  <ListItem 
                    button 
                    onClick={() => handleDocumentClick(doc?._id)}
                    sx={{ py: 2 }}
                    disabled={!doc?._id}
                  >
                    <ListItemIcon>
                      <InsertDriveFileIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={doc?.name || 'Unbenanntes Dokument'}
                      secondary={`${formatFileSize(doc?.size || 0)} • Hochgeladen am ${formatDate(doc?.createdAt || new Date())}`}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;
