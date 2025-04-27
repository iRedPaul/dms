import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

function FileUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

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
      setError('Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
    }
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
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          mb: 2
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Ziehen Sie Dokumente hierher oder klicken Sie zum Auswählen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unterstützte Formate: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT (max. 50MB)
        </Typography>
      </Box>
      
      {file && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Ausgewählte Datei:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </Typography>
        </Box>
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
      >
        {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
      </Button>
    </Box>
  );
}

export default FileUploader;
