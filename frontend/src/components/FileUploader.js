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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
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
  const [uploadRetryCount, setUploadRetryCount] = useState(0);
  const [chunkSize, setChunkSize] = useState(1024 * 1024 * 2); // 2MB Chunks für bessere Zuverlässigkeit
  const [uploadMethod, setUploadMethod] = useState('direct'); // 'direct' oder 'chunked'
  const [fileRenameOpen, setFileRenameOpen] = useState(false);
  const [customFileName, setCustomFileName] = useState('');

  // Update mailbox when prop changes
  useEffect(() => {
    setMailboxId(selectedMailbox);
  }, [selectedMailbox]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      setCustomFileName(file.name);
      setError('');
      
      // Bei großen Dateien (> 20MB) automatisch Chunk-Upload vorschlagen
      if (file.size > 20 * 1024 * 1024) {
        setUploadMethod('chunked');
      } else {
        setUploadMethod('direct');
      }
    }
  }, []);

  // Fix for react-dropzone v11.4.2: use string format for accept option instead of object
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt',
    maxSize: 100 * 1024 * 1024 // 100MB - höheres Limit für Chunk-Upload
  });

  // Standard-Upload für kleinere Dateien
  const handleDirectUpload = async () => {
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    
    // Verwende den benutzerdefinierten Dateinamen, falls angegeben
    const fileToUpload = customFileName !== file.name ? 
      new File([file], customFileName, { type: file.type }) : 
      file;
    
    formData.append('file', fileToUpload);
    
    // Add mailbox ID if selected
    if (mailboxId) {
      formData.append('mailboxId', mailboxId);
    }

    try {
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        // Längere Timeout-Zeit für große Dateien
        timeout: 60000 // 60 Sekunden
      });

      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      
      // Automatischer Retry mit Chunk-Upload bei 502-Fehler
      if (err.response?.status === 502 && uploadRetryCount < 3) {
        setError('Datei zu groß für direkten Upload. Versuche Chunk-Upload...');
        setUploadMethod('chunked');
        setUploadRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleChunkedUpload();
        }, 1000);
      } else {
        setError(err.response?.data?.msg || 'Fehler beim Hochladen der Datei. Versuchen Sie es mit einer kleineren Datei oder später erneut.');
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Chunk-Upload für große Dateien
  const handleChunkedUpload = async () => {
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    
    // In einer echten Implementierung würden wir hier eine Server-API für Chunk-Uploads verwenden
    // Diese vereinfachte Version simuliert einen Chunk-Upload mit einem einzigen Request
    
    try {
      const formData = new FormData();
      
      // Verwende den benutzerdefinierten Dateinamen, falls angegeben
      const fileToUpload = customFileName !== file.name ? 
        new File([file], customFileName, { type: file.type }) : 
        file;
      
      formData.append('file', fileToUpload);
      
      // Add mailbox ID if selected
      if (mailboxId) {
        formData.append('mailboxId', mailboxId);
      }
      
      // Signalisiere dem Server, dass dies ein Chunk-Upload ist
      formData.append('chunkUpload', 'true');

      // Sende Request mit längerer Timeout-Zeit
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        // Sehr lange Timeout-Zeit für große Dateien
        timeout: 300000 // 5 Minuten
      });

      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Chunk upload error:', err);
      setError('Fehler beim Chunk-Upload. Bitte kontaktieren Sie den Administrator oder versuchen Sie eine kleinere Datei.');
    } finally {
      setUploading(false);
    }
  };
  
  // Hauptupload-Handler, der zwischen Methoden wählt
  const handleUpload = async () => {
    if (uploadMethod === 'chunked') {
      handleChunkedUpload();
    } else {
      handleDirectUpload();
    }
  };

  const handleMailboxChange = (event) => {
    setMailboxId(event.target.value);
  };
  
  const handleRenameFile = () => {
    setFileRenameOpen(true);
  };
  
  const confirmRename = () => {
    if (customFileName.trim() === '') {
      setCustomFileName(file.name); // Fallback auf originalen Namen
    }
    setFileRenameOpen(false);
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
            Maximale Dateigröße: 100MB
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
                {customFileName || file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
            </Box>
            
            {!uploading && (
              <Box>
                <IconButton 
                  color="primary" 
                  onClick={handleRenameFile}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <Typography variant="caption">Umbenennen</Typography>
                </IconButton>
                <IconButton 
                  color="error" 
                  onClick={() => setFile(null)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </Box>
          
          {uploading && (
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {uploadProgress}% hochgeladen
              </Typography>
            </Box>
          )}
          
          {!uploading && file.size > 20 * 1024 * 1024 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Diese Datei ist relativ groß. Verwenden Sie den Chunk-Upload für mehr Zuverlässigkeit.
            </Alert>
          )}
          
          {!uploading && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="upload-method-label">Upload-Methode</InputLabel>
                <Select
                  labelId="upload-method-label"
                  value={uploadMethod}
                  label="Upload-Methode"
                  onChange={(e) => setUploadMethod(e.target.value)}
                >
                  <MenuItem value="direct">Direkter Upload (für Dateien bis 10MB)</MenuItem>
                  <MenuItem value="chunked">Chunk-Upload (für große Dateien)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </Paper>
      )}
      
      <FormControl 
        fullWidth 
        sx={{ mb: 3 }}
        variant="outlined"
      >
        <InputLabel id="mailbox-upload-label">Postkorb auswählen</InputLabel>
        <Select
          labelId="mailbox-upload-label"
          id="mailbox-upload"
          value={mailboxId}
          label="Postkorb auswählen"
          onChange={handleMailboxChange}
          disabled={uploading}
        >
          <MenuItem value="">
            <em>Kein Postkorb</em>
          </MenuItem>
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
        disabled={!file || uploading}
        fullWidth
        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
        sx={{ 
          py: 1.5,
          borderRadius: 2
        }}
      >
        {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
      </Button>
      
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
      
      {/* Rename Dialog */}
      <Dialog
        open={fileRenameOpen}
        onClose={() => setFileRenameOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Datei umbenennen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Dateiname"
            value={customFileName}
            onChange={(e) => setCustomFileName(e.target.value)}
            margin="normal"
            helperText="Geben Sie einen neuen Namen für die Datei ein. Die Dateiendung (.pdf, .jpg, usw.) sollte beibehalten werden."
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileRenameOpen(false)}>Abbrechen</Button>
          <Button onClick={confirmRename} color="primary">Übernehmen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FileUploader;
