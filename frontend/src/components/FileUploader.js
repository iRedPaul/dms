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
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import axios from 'axios';

function FileUploader({ onUploadSuccess, mailboxes = [], selectedMailbox = '' }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [mailboxId, setMailboxId] = useState(selectedMailbox);

  // Update mailbox when prop changes
  useEffect(() => {
    setMailboxId(selectedMailbox);
  }, [selectedMailbox]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  // Fix for react-dropzone v11.4.2: use string format for accept option instead of object
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt',
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    
    // Add mailbox ID if selected
    if (mailboxId) {
      formData.append('mailboxId', mailboxId);
    }

    try {
      await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.msg || 'Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
    }
  };

  const handleMailboxChange = (event) => {
    setMailboxId(event.target.value);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          mb: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(0, 0, 0, 0.01)'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Dateien hierher ziehen oder klicken
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unterstützte Formate: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT (max. 50MB)
        </Typography>
      </Box>
      
      {file && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InsertDriveFileIcon 
              sx={{ 
                fontSize: 40, 
                color: file.type.includes('pdf') ? '#F44336' : 
                       file.type.includes('image') ? '#4CAF50' : 
                       file.type.includes('word') ? '#2196F3' : 
                       'primary.main',
                mr: 2 
              }} 
            />
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap title={file.name}>
                {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
      
      {mailboxes.length > 0 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="mailbox-upload-label">Postkorb auswählen</InputLabel>
          <Select
            labelId="mailbox-upload-label"
            id="mailbox-upload"
            value={mailboxId}
            label="Postkorb auswählen"
            onChange={handleMailboxChange}
            disabled={uploading}
          >
            {mailboxes.map((mailbox) => (
              <MenuItem key={mailbox._id} value={mailbox._id}>
                {mailbox.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1 }} />
          <Typography variant="body2" align="center">
            {uploadProgress}% hochgeladen
          </Typography>
        </Box>
      )}
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        fullWidth
        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
        sx={{ py: 1.2 }}
      >
        {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
      </Button>
    </Box>
  );
}

export default FileUploader;
