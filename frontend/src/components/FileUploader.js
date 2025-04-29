import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import BackupIcon from '@mui/icons-material/Backup';
import axios from 'axios';
import { formatFileSize } from '../utils/helpers';

function FileUploader({ onUploadSuccess, mailboxes = [], selectedMailbox = '' }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [mailboxId, setMailboxId] = useState(selectedMailbox);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Update mailbox when prop changes
  useEffect(() => {
    setMailboxId(selectedMailbox);
  }, [selectedMailbox]);

  // Auto-select first mailbox if none is selected
  useEffect(() => {
    if (!mailboxId && mailboxes.length > 0) {
      setMailboxId(mailboxes[0]._id);
    }
  }, [mailboxes, mailboxId]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  // Configure dropzone with modern syntax and better file handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    if (!mailboxId) {
      setError('Bitte wählen Sie einen Postkorb aus');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mailboxId', mailboxId);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        timeout: 60000 // Extended timeout for larger files
      };

      await axios.post('/api/documents/upload', formData, config);

      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = 'Fehler beim Hochladen der Datei';
      
      if (err.response) {
        // Server responded with an error
        if (err.response.status === 413) {
          errorMessage = 'Die Datei ist zu groß. Maximale Größe: 50MB';
        } else if (err.response.data && err.response.data.msg) {
          errorMessage = err.response.data.msg;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Der Server antwortet nicht. Bitte versuchen Sie es später erneut.';
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleMailboxChange = (event) => {
    setMailboxId(event.target.value);
  };

  // Get file type icon color
  const getFileTypeColor = (fileName) => {
    if (!fileName) return '#9E9E9E';
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return '#4CAF50'; // Green for images
    } else if (extension === 'pdf') {
      return '#F44336'; // Red for PDFs
    } else if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(extension)) {
      return '#2196F3'; // Blue for documents
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
      return '#FF9800'; // Orange for spreadsheets
    } else {
      return '#9E9E9E'; // Grey for other types
    }
  };

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': {
              display: 'flex',
              alignItems: 'center'
            }
          }}
        >
          {error}
        </Alert>
      )}
      
      {!file ? (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'rgba(0, 0, 0, 0.12)',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            backgroundColor: isDragActive ? 'rgba(0, 99, 166, 0.04)' : 'background.paper',
            cursor: 'pointer',
            mb: 3,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(0, 99, 166, 0.04)'
            }
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon 
            sx={{ 
              fontSize: 60, 
              color: isDragActive ? 'primary.main' : 'text.secondary', 
              mb: 2,
              opacity: isDragActive ? 1 : 0.7
            }} 
          />
          <Typography 
            variant="h6" 
            fontWeight={500} 
            color={isDragActive ? 'primary.main' : 'text.primary'} 
            gutterBottom
          >
            {isDragActive 
              ? 'Datei hier ablegen...' 
              : 'Dateien hierher ziehen oder klicken'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unterstützte Formate: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Maximale Dateigröße: 50MB
          </Typography>
        </Box>
      ) : (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {uploading && (
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12
              }} 
            />
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: `${getFileTypeColor(file.name)}20`,
                color: getFileTypeColor(file.name),
                width: 48,
                height: 48,
                mr: 2
              }}
            >
              <InsertDriveFileIcon />
            </Avatar>
            
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap fontWeight={500}>
                {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
            </Box>
            
            {!uploading && (
              <IconButton 
                color="error" 
                onClick={() => setFile(null)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
          
          {uploading && (
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {uploadProgress}% hochgeladen
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Postkorb Auswahl - Ohne "Kein Postkorb" Option */}
      <FormControl 
        fullWidth 
        sx={{ mb: 3 }}
        variant="outlined"
        required
      >
        <InputLabel id="mailbox-upload-label">Postkorb auswählen</InputLabel>
        <Select
          labelId="mailbox-upload-label"
          id="mailbox-upload"
          value={mailboxId}
          label="Postkorb auswählen"
          onChange={handleMailboxChange}
          disabled={uploading || mailboxes.length === 0}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: (!mailboxId && file) ? 'error.main' : undefined
            }
          }}
        >
          {mailboxes.map((mailbox) => (
            <MenuItem key={mailbox._id} value={mailbox._id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FolderIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                {mailbox.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || uploading || !mailboxId || mailboxes.length === 0}
        fullWidth
        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
        sx={{ 
          py: 1.5,
          borderRadius: 2
        }}
      >
        {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
      </Button>
      
      {mailboxes.length === 0 && (
        <Alert 
          severity="warning" 
          sx={{ mt: 3, borderRadius: 2 }}
        >
          Keine Postkörbe verfügbar. Bitte wenden Sie sich an Ihren Administrator.
        </Alert>
      )}
      
      {file && !uploading && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={() => setFile(null)}
          >
            Datei ändern
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default FileUploader;
