import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Button,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import api from '../../../services/api';

// Eigenschaften-Editor für Workflow-Knoten
const WorkflowProperties = ({ node, updateNodeData }) => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [stepData, setStepData] = useState(node.data.step);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldIndex, setFieldIndex] = useState(null);
  
  // Benutzer beim Laden abrufen
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
        // Beispieldaten, falls die API nicht verfügbar ist
        setUsers([
          { _id: '1', username: 'admin', name: 'Administrator', role: 'admin' },
          { _id: '2', username: 'approver1', name: 'Max Mustermann', role: 'approver' },
          { _id: '3', username: 'user1', name: 'Erika Musterfrau', role: 'user' }
        ]);
      }
    };
    
    // Stepdata Standardwerte
    if (!stepData.formConfig) {
      setStepData({
        ...stepData,
        formConfig: { fields: [] }
      });
    }
    
    fetchUsers();
  }, []);
  
  // Daten aktualisieren
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...stepData, [name]: value };
    setStepData(updatedData);
    updateNodeData(updatedData);
  };
  
  // Zuweisungstyp aktualisieren
  const handleAssignmentTypeChange = (e) => {
    const value = e.target.value;
    const updatedData = {
      ...stepData,
      assignedTo: {
        ...stepData.assignedTo,
        type: value,
        value: '' // Zurücksetzen beim Typwechsel
      }
    };
    setStepData(updatedData);
    updateNodeData(updatedData);
  };
  
  // Zuweisungswert aktualisieren
  const handleAssignmentValueChange = (e) => {
    const value = e.target.value;
    const updatedData = {
      ...stepData,
      assignedTo: {
        ...stepData.assignedTo,
        value
      }
    };
    setStepData(updatedData);
    updateNodeData(updatedData);
  };
  
  // Formfeld-Dialog öffnen
  const handleOpenFormDialog = (field = null, index = null) => {
    setCurrentField(field || { 
      name: '', 
      label: '', 
      type: 'text', 
      required: false,
      options: [],
      defaultValue: ''
    });
    setFieldIndex(index);
    setOpenFormDialog(true);
  };
  
  // Formfeld-Dialog schließen
  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setCurrentField(null);
    setFieldIndex(null);
  };
  
  // Formfeld speichern
  const handleSaveField = () => {
    const updatedFields = [...(stepData.formConfig?.fields || [])];
    
    if (fieldIndex !== null) {
      // Vorhandenes Feld aktualisieren
      updatedFields[fieldIndex] = currentField;
    } else {
      // Neues Feld hinzufügen
      updatedFields.push(currentField);
    }
    
    const updatedData = {
      ...stepData,
      formConfig: {
        ...stepData.formConfig,
        fields: updatedFields
      }
    };
    
    setStepData(updatedData);
    updateNodeData(updatedData);
    handleCloseFormDialog();
  };
  
  // Formfeld löschen
  const handleDeleteField = (index) => {
    const updatedFields = [...(stepData.formConfig?.fields || [])];
    updatedFields.splice(index, 1);
    
    const updatedData = {
      ...stepData,
      formConfig: {
        ...stepData.formConfig,
        fields: updatedFields
      }
    };
    
    setStepData(updatedData);
    updateNodeData(updatedData);
  };
  
  // Formfeld-Input ändern
  const handleFieldInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setCurrentField({
      ...currentField,
      [name]: newValue
    });
  };
  
  // Optionen für das Formfeld aktualisieren
  const handleAddOption = () => {
    if (!currentField.newOption || currentField.options.includes(currentField.newOption)) {
      return;
    }
    
    setCurrentField({
      ...currentField,
      options: [...currentField.options, currentField.newOption],
      newOption: ''
    });
  };
  
  // Option entfernen
  const handleRemoveOption = (option) => {
    setCurrentField({
      ...currentField,
      options: currentField.options.filter(opt => opt !== option)
    });
  };
  
  // Rendering für verschiedene Schritt-Typen
  const renderTypeSpecificFields = () => {
    switch (stepData.type) {
      case 'form':
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">Formularfelder</Typography>
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => handleOpenFormDialog()}
              >
                Feld hinzufügen
              </Button>
            </Box>
            
            <List>
              {stepData.formConfig?.fields?.map((field, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenFormDialog(field, index)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteField(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={field.label}
                    secondary={`${field.type}${field.required ? ' (erforderlich)' : ''}`}
                  />
                </ListItem>
              ))}
              
              {(!stepData.formConfig?.fields || stepData.formConfig.fields.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Keine Felder definiert. Klicken Sie auf "Feld hinzufügen" um ein Formularfeld zu erstellen.
                </Typography>
              )}
            </List>
          </Box>
        );
        
      case 'approval':
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Zuweisungstyp</InputLabel>
              <Select
                value={stepData.assignedTo?.type || 'role'}
                onChange={handleAssignmentTypeChange}
                label="Zuweisungstyp"
              >
                <MenuItem value="user">Spezifischer Benutzer</MenuItem>
                <MenuItem value="role">Rolle</MenuItem>
                <MenuItem value="dynamic">Dynamisch (zur Laufzeit)</MenuItem>
              </Select>
            </FormControl>
            
            {stepData.assignedTo?.type === 'user' && (
              <FormControl fullWidth>
                <InputLabel>Benutzer</InputLabel>
                <Select
                  value={stepData.assignedTo?.value || ''}
                  onChange={handleAssignmentValueChange}
                  label="Benutzer"
                >
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name} ({user.username})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {stepData.assignedTo?.type === 'role' && (
              <FormControl fullWidth>
                <InputLabel>Rolle</InputLabel>
                <Select
                  value={stepData.assignedTo?.value || ''}
                  onChange={handleAssignmentValueChange}
                  label="Rolle"
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="approver">Genehmiger</MenuItem>
                  <MenuItem value="user">Standardbenutzer</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {stepData.assignedTo?.type === 'dynamic' && (
              <TextField
                fullWidth
                label="Dynamischer Wert (Formel oder Variable)"
                name="assignedToValue"
                value={stepData.assignedTo?.value || ''}
                onChange={handleAssignmentValueChange}
                helperText="z.B. ${document.metadata.department}"
              />
            )}
          </Box>
        );
        
      case 'notification':
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Benachrichtigungstext"
              name="notificationText"
              value={stepData.notificationText || ''}
              onChange={handleInputChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Empfänger</InputLabel>
              <Select
                value={stepData.notificationRecipient || 'assignee'}
                name="notificationRecipient"
                onChange={handleInputChange}
                label="Empfänger"
              >
                <MenuItem value="assignee">Zugewiesener Benutzer</MenuItem>
                <MenuItem value="document_creator">Dokument-Ersteller</MenuItem>
                <MenuItem value="custom">Benutzerdefiniert...</MenuItem>
              </Select>
            </FormControl>
            
            {stepData.notificationRecipient === 'custom' && (
              <TextField
                fullWidth
                label="Benutzerdefinierter Empfänger"
                name="customRecipient"
                value={stepData.customRecipient || ''}
                onChange={handleInputChange}
                sx={{ mt: 2 }}
                helperText="E-Mail-Adresse oder Benutzername"
              />
            )}
          </Box>
        );
        
      case 'condition':
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Bedingungsfeld"
              name="conditionField"
              value={stepData.conditionField || ''}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              helperText="z.B. document.metadata.amount"
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={stepData.conditionOperator || 'equals'}
                name="conditionOperator"
                onChange={handleInputChange}
                label="Operator"
              >
                <MenuItem value="equals">Ist gleich</MenuItem>
                <MenuItem value="not_equals">Ist nicht gleich</MenuItem>
                <MenuItem value="greater_than">Größer als</MenuItem>
                <MenuItem value="less_than">Kleiner als</MenuItem>
                <MenuItem value="contains">Enthält</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Vergleichswert"
              name="conditionValue"
              value={stepData.conditionValue || ''}
              onChange={handleInputChange}
              helperText="Wert, mit dem verglichen wird"
            />
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <TextField
        fullWidth
        label="Name"
        name="name"
        value={stepData.name || ''}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        label="Beschreibung"
        name="description"
        value={stepData.description || ''}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        multiline
        rows={2}
        sx={{ mb: 2 }}
      />
      
      {/* Typ-spezifische Felder */}
      {renderTypeSpecificFields()}
      
      {/* Formfeld-Dialog */}
      <Dialog
        open={openFormDialog}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {fieldIndex !== null ? 'Formularfeld bearbeiten' : 'Neues Formularfeld'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Feldname (technisch)"
                name="name"
                value={currentField?.name || ''}
                onChange={handleFieldInputChange}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Anzeigename"
                name="label"
                value={currentField?.label || ''}
                onChange={handleFieldInputChange}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Feldtyp</InputLabel>
                <Select
                  name="type"
                  value={currentField?.type || 'text'}
                  onChange={handleFieldInputChange}
                  label="Feldtyp"
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Zahl</MenuItem>
                  <MenuItem value="date">Datum</MenuItem>
                  <MenuItem value="select">Auswahlliste</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="textarea">Textbereich</MenuItem>
                  <MenuItem value="file">Datei</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Erforderlich</InputLabel>
                <Select
                  name="required"
                  value={currentField?.required ? 'true' : 'false'}
                  onChange={(e) => handleFieldInputChange({
                    target: {
                      name: 'required',
                      type: 'checkbox',
                      checked: e.target.value === 'true'
                    }
                  })}
                  label="Erforderlich"
                >
                  <MenuItem value="true">Ja</MenuItem>
                  <MenuItem value="false">Nein</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Standardwert"
                name="defaultValue"
                value={currentField?.defaultValue || ''}
                onChange={handleFieldInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            {/* Optionen für Auswahllisten */}
            {currentField?.type === 'select' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Optionen
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Neue Option"
                    name="newOption"
                    value={currentField?.newOption || ''}
                    onChange={handleFieldInputChange}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddOption}
                    sx={{ ml: 1 }}
                  >
                    Hinzufügen
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentField?.options?.map((option, index) => (
                    <Chip
                      key={index}
                      label={option}
                      onDelete={() => handleRemoveOption(option)}
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Abbrechen</Button>
          <Button 
            onClick={handleSaveField} 
            variant="contained"
            disabled={!currentField?.name || !currentField?.label}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowProperties;