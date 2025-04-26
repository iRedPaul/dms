import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

const DocumentUpload = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [documentData, setDocumentData] = useState({
    title: '',
    description: '',
    documentType: 'other',
    inbox: '',
    tags: []
  });
  const [metadata, setMetadata] = useState({});
  const [metadataFields, setMetadataFields] = useState([
    { key: '', value: '' }
  ]);
  const [tag, setTag] = useState('');
  const [inboxes, setInboxes] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Postkörbe und Workflows beim Laden abrufen
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Postkörbe abrufen
        const inboxResponse = await api.get('/api/inboxes');
        setInboxes(inboxResponse.data);

        // Workflows abrufen
        const workflowResponse = await api.get('/api/workflows?isActive=true');
        setWorkflows(workflowResponse.data);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      }
    };

    fetchData();
  }, []);

  // Dropzone für Drag & Drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const newFile = acceptedFiles[0];
      setFile(newFile);
      
      // Wenn kein Titel gesetzt wurde, Dateiname als Titel verwenden
      if (!documentData.title) {
        setDocumentData({
          ...documentData,
          title: newFile.name.split('.')[0]
        });
      }
    }
  }, [documentData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1
  });

  // Dokument-Metadaten ändern
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentData({
      ...documentData,
      [name]: value
    });
  };

  // Metadaten-Felder ändern
  const handleMetadataChange = (index, field, value) => {
    const updatedFields = [...metadataFields];
    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);

    // Metadaten-Objekt aktualisieren
    const newMetadata = {};
    metadataFields.forEach(item => {
      if (item.key && item.value) {
        newMetadata[item.key] = item.value;
      }
    });
    setMetadata(newMetadata);
  };

  // Metadaten-Feld hinzufügen
  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  // Metadaten-Feld entfernen
  const removeMetadataField = (index) => {
    const updatedFields = [...metadataFields];
    updatedFields.splice(index, 1);
    setMetadataFields(updatedFields);
  };

  // Tag hinzufügen
  const addTag = () => {
    if (tag && !documentData.tags.includes(tag)) {
      setDocumentData({
        ...documentData,
        tags: [...documentData.tags, tag]
      });
      setTag('');
    }
  };

  // Tag entfernen
  const removeTag = (tagToRemove) => {
    setDocumentData({
      ...documentData,
      tags: documentData.tags.filter(t => t !== tagToRemove)
    });
  };

  // Dokument hochladen
  const uploadDocument = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      setIsSubmitting(true);

      // FormData für den Upload erstellen
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', documentData.title);
      formData.append('description', documentData.description);
      formData.append('documentType', documentData.documentType);
      
      if (documentData.inbox) {
        formData.append('inbox', documentData.inbox);
      }
      
      if (documentData.tags.length > 0) {
        formData.append('tags', documentData.tags.join(','));
      }
      
      // Metadaten als JSON-String hinzufügen
      formData.append('metadata', JSON.stringify(metadata));

      // Dokument hochladen
      const response = await api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Dokument erfolgreich hochgeladen');
      
      // Wenn ein Workflow ausgewählt wurde, diesen starten
      if (selectedWorkflow) {
        await api.post(`/api/workflows/${selectedWorkflow}/start/${response.data._id}`);
        setSuccess('Dokument hochgeladen und Workflow gestartet');
      }

      // Nach erfolgreichem Upload zur Dokumentenliste navigieren
      setTimeout(() => {
        navigate('/documents');
      }, 2000);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      setError(error.response?.data?.message || 'Fehler beim Hochladen des Dokuments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dokument hochladen
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={uploadDocument}>
          <Grid container spacing={3}>
            {/* Drag & Drop Upload-Bereich */}
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: `2px dashed ${theme.palette.primary.main}`,
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: isDragActive
                    ? theme.palette.primary.light + '20'
                    : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '10'
                  }
                }}
              >
                <input {...getInputProps()} />
                {file ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                    <Typography>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</Typography>
                    <Button
                      startIcon={<DeleteIcon />}
                      color="error"
                      sx={{ ml: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      Entfernen
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6">
                      {isDragActive
                        ? 'Dateien hier ablegen...'
                        : 'Drag & Drop oder klicken zum Auswählen'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Unterstützte Formate: PDF, Word, Excel, Bilder, Text
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Dokumenteninformationen */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Titel"
                name="title"
                value={documentData.title}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Beschreibung"
                name="description"
                value={documentData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Dokumenttyp</InputLabel>
                <Select
                  name="documentType"
                  value={documentData.documentType}
                  onChange={handleInputChange}
                  label="Dokumenttyp"
                >
                  <MenuItem value="invoice">Rechnung</MenuItem>
                  <MenuItem value="contract">Vertrag</MenuItem>
                  <MenuItem value="report">Bericht</MenuItem>
                  <MenuItem value="form">Formular</MenuItem>
                  <MenuItem value="other">Sonstiges</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Postkorb</InputLabel>
                <Select
                  name="inbox"
                  value={documentData.inbox}
                  onChange={handleInputChange}
                  label="Postkorb"
                >
                  <MenuItem value="">
                    <em>Keinen Postkorb auswählen</em>
                  </MenuItem>
                  {inboxes.map((inbox) => (
                    <MenuItem key={inbox._id} value={inbox._id}>
                      {inbox.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Workflow starten</InputLabel>
                <Select
                  value={selectedWorkflow}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                  label="Workflow starten"
                >
                  <MenuItem value="">
                    <em>Keinen Workflow starten</em>
                  </MenuItem>
                  {workflows.map((workflow) => (
                    <MenuItem key={workflow._id} value={workflow._id}>
                      {workflow.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Metadaten und Tags */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Metadaten
              </Typography>

              {metadataFields.map((field, index) => (
                <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Feld"
                      value={field.key}
                      onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Wert"
                      value={field.value}
                      onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      color="error"
                      onClick={() => removeMetadataField(index)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </Button>
                  </Grid>
                </Grid>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={addMetadataField}
                variant="outlined"
                size="small"
                sx={{ mb: 3 }}
              >
                Feld hinzufügen
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>

              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tag hinzufügen"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  startIcon={<AddIcon />}
                  onClick={addTag}
                  variant="outlined"
                  sx={{ ml: 1 }}
                >
                  Hinzufügen
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {documentData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            {/* Submit-Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || !file}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <UploadIcon />}
                >
                  {isSubmitting ? 'Wird hochgeladen...' : 'Dokument hochladen'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Feedback-Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentUpload;