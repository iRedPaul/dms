import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  History as HistoryIcon,
  PlayArrow as StartIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Folder as FolderIcon,
  Label as LabelIcon,
  WorkOutline as WorkflowIcon,
  Info as InfoIcon,
  Receipt as InvoiceIcon,
  Assignment as ContractIcon,
  Assessment as ReportIcon,
  FileCopy as FormIcon,
  Folder as OtherIcon
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../services/api';

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Dokument-Typen mit Icons
const documentTypes = {
  invoice: { icon: <InvoiceIcon />, label: 'Rechnung', color: '#ff9800' },
  contract: { icon: <ContractIcon />, label: 'Vertrag', color: '#2196f3' },
  report: { icon: <ReportIcon />, label: 'Bericht', color: '#4caf50' },
  form: { icon: <FormIcon />, label: 'Formular', color: '#9c27b0' },
  other: { icon: <OtherIcon />, label: 'Sonstiges', color: '#607d8b' }
};

// Dokument-Status mit Farben
const documentStatus = {
  draft: { label: 'Entwurf', color: '#9e9e9e' },
  active: { label: 'Aktiv', color: '#4caf50' },
  archived: { label: 'Archiviert', color: '#ff9800' },
  deleted: { label: 'Gelöscht', color: '#f44336' }
};

// Workflow-Status mit Farben
const workflowStatus = {
  not_started: { label: 'Nicht gestartet', color: '#9e9e9e' },
  in_progress: { label: 'In Bearbeitung', color: '#2196f3' },
  completed: { label: 'Abgeschlossen', color: '#4caf50' },
  canceled: { label: 'Abgebrochen', color: '#f44336' }
};

// Tabbable Interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Ein Beispieldokument für die Demo
const getDummyDocument = (id) => {
  return {
    _id: id,
    title: 'Beispielrechnung 2023-001',
    description: 'Rechnung für Dienstleistungen im Mai 2023',
    documentType: 'invoice',
    status: 'active',
    createdAt: new Date('2023-05-15'),
    uploadedBy: {
      _id: 'user1',
      name: 'Max Mustermann',
      username: 'max'
    },
    filename: 'rechnung_2023_001.pdf',
    originalFilename: 'rechnung_2023_001.pdf',
    mimeType: 'application/pdf',
    size: 2540000,
    path: '/path/to/document',
    currentWorkflow: {
      workflow: {
        _id: 'workflow1',
        name: 'Rechnungsfreigabe'
      },
      status: 'in_progress',
      currentStep: 1,
      startedAt: new Date('2023-05-16'),
      completedAt: null
    },
    inbox: {
      _id: 'inbox1',
      name: 'Rechnungswesen'
    },
    tags: ['rechnung', 'mai-2023', 'dienstleistung'],
    metadata: {
      rechnungsnummer: '2023-001',
      lieferant: 'Musterfirma GmbH',
      betrag: '1250.00',
      währung: 'EUR',
      fälligkeitsdatum: '2023-06-15'
    },
    version: 1,
    previousVersions: []
  };
};

// Beispiel-Workflow-Historie
const getWorkflowHistory = () => [
  {
    step: 'Dokumentenupload',
    date: new Date('2023-05-16T09:15:00'),
    user: 'Max Mustermann',
    status: 'completed',
    comment: 'Dokument hochgeladen'
  },
  {
    step: 'Prüfung durch Sachbearbeiter',
    date: new Date('2023-05-17T14:30:00'),
    user: 'Erika Musterfrau',
    status: 'completed',
    comment: 'Rechnung geprüft und für korrekt befunden'
  },
  {
    step: 'Freigabe durch Abteilungsleiter',
    date: new Date(),
    user: null,
    status: 'in_progress',
    comment: null
  },
  {
    step: 'Buchhaltung',
    date: null,
    user: null,
    status: 'not_started',
    comment: null
  }
];

// Beispiel-Workflows für das Starten eines Workflows
const getAvailableWorkflows = () => [
  { _id: 'workflow1', name: 'Rechnungsfreigabe' },
  { _id: 'workflow2', name: 'Vertragsfreigabe' },
  { _id: 'workflow3', name: 'Berichterstellung' }
];

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Zustand
  const [document, setDocument] = useState(null);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Aktionsmenü-Zustände
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [workflowAnchorEl, setWorkflowAnchorEl] = useState(null);
  
  // Dialog-Zustände
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [startWorkflowDialogOpen, setStartWorkflowDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  
  // Dokument laden
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        // In einer realen App würden die Daten von der API geladen werden
        // const response = await api.get(`/api/documents/${id}`);
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyDoc = getDummyDocument(id);
          setDocument(dummyDoc);
          setWorkflowHistory(getWorkflowHistory());
          setAvailableWorkflows(getAvailableWorkflows());
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden des Dokuments:', error);
        setError('Fehler beim Laden des Dokuments. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [id]);
  
  // Menü-Handler
  const handleActionsClick = (event) => {
    setActionsAnchorEl(event.currentTarget);
  };
  
  const handleActionsClose = () => {
    setActionsAnchorEl(null);
  };
  
  const handleWorkflowClick = (event) => {
    setWorkflowAnchorEl(event.currentTarget);
  };
  
  const handleWorkflowClose = () => {
    setWorkflowAnchorEl(null);
  };
  
  // Dialog-Handler
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleActionsClose();
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleOpenArchiveDialog = () => {
    setArchiveDialogOpen(true);
    handleActionsClose();
  };
  
  const handleCloseArchiveDialog = () => {
    setArchiveDialogOpen(false);
  };
  
  const handleOpenStartWorkflowDialog = () => {
    setStartWorkflowDialogOpen(true);
    handleWorkflowClose();
  };
  
  const handleCloseStartWorkflowDialog = () => {
    setStartWorkflowDialogOpen(false);
    setSelectedWorkflow(null);
  };
  
  // Aktions-Handler
  const handleEditDocument = () => {
    // Zur Bearbeitungsseite navigieren
    alert(`Dokument "${document.title}" bearbeiten`);
    handleActionsClose();
  };
  
  const handleDeleteDocument = () => {
    // Dokument löschen
    alert(`Dokument "${document.title}" gelöscht`);
    handleCloseDeleteDialog();
    navigate('/documents');
  };
  
  const handleArchiveDocument = () => {
    // Dokument archivieren
    alert(`Dokument "${document.title}" archiviert`);
    handleCloseArchiveDialog();
    // Status aktualisieren
    setDocument({
      ...document,
      status: 'archived'
    });
  };
  
  const handleDownloadDocument = () => {
    // Dokument herunterladen
    alert(`Dokument "${document.title}" wird heruntergeladen`);
    handleActionsClose();
  };
  
  const handleSelectWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
  };
  
  const handleStartWorkflow = () => {
    // Workflow starten
    alert(`Workflow "${selectedWorkflow.name}" für Dokument "${document.title}" gestartet`);
    handleCloseStartWorkflowDialog();
    // Dokumentenstatus aktualisieren
    setDocument({
      ...document,
      currentWorkflow: {
        workflow: {
          _id: selectedWorkflow._id,
          name: selectedWorkflow.name
        },
        status: 'in_progress',
        currentStep: 0,
        startedAt: new Date(),
        completedAt: null
      }
    });
  };
  
  // PDF-Handler
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  
  // Tab-Handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Hilfsfunktionen
  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd.MM.yyyy', { locale: de });
  };
  
  const formatDateTime = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de });
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Rendering wenn noch geladen wird
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Rendering bei Fehler
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/documents')}
          sx={{ mt: 2 }}
        >
          Zurück zur Dokumentenliste
        </Button>
      </Box>
    );
  }
  
  // Rendering wenn kein Dokument gefunden wurde
  if (!document) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Dokument nicht gefunden
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/documents')}
          sx={{ mt: 2 }}
        >
          Zurück zur Dokumentenliste
        </Button>
      </Box>
    );
  }
  
  // Dokument-Typ und Status
  const docType = documentTypes[document.documentType] || documentTypes.other;
  const docStatus = documentStatus[document.status] || { label: document.status, color: '#9e9e9e' };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ mr: 2, color: docType.color }}>
              {docType.icon}
            </Box>
            <Typography variant="h4">{document.title}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={docType.label}
              size="small"
              sx={{
                backgroundColor: `${docType.color}20`,
                color: docType.color,
                fontWeight: 'medium'
              }}
            />
            
            <Chip
              label={docStatus.label}
              size="small"
              sx={{
                backgroundColor: `${docStatus.color}20`,
                color: docStatus.color,
                borderColor: docStatus.color,
                fontWeight: 'medium'
              }}
              variant="outlined"
            />
            
            {document.currentWorkflow && (
              <Chip
                label={`${document.currentWorkflow.workflow.name}: ${workflowStatus[document.currentWorkflow.status].label}`}
                size="small"
                icon={<WorkflowIcon style={{ fontSize: '1rem' }} />}
                sx={{
                  backgroundColor: `${workflowStatus[document.currentWorkflow.status].color}20`,
                  color: workflowStatus[document.currentWorkflow.status].color,
                  '& .MuiChip-icon': {
                    color: workflowStatus[document.currentWorkflow.status].color
                  }
                }}
              />
            )}
            
            {document.inbox && (
              <Chip
                label={document.inbox.name}
                size="small"
                icon={<FolderIcon style={{ fontSize: '1rem' }} />}
                sx={{ 
                  '& .MuiChip-icon': {
                    color: theme.palette.primary.main
                  }
                }}
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        <Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadDocument}
            sx={{ mr: 1 }}
          >
            Herunterladen
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<MoreIcon />}
            onClick={handleActionsClick}
          >
            Aktionen
          </Button>
          
          <Menu
            anchorEl={actionsAnchorEl}
            open={Boolean(actionsAnchorEl)}
            onClose={handleActionsClose}
          >
            <MenuItem onClick={handleEditDocument}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Bearbeiten</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleOpenArchiveDialog} disabled={document.status === 'archived'}>
              <ListItemIcon>
                <ArchiveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Archivieren</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleOpenDeleteDialog}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: 'error.main' }}>Löschen</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="document tabs">
          <Tab label="Dokument" id="document-tab-0" aria-controls="document-tabpanel-0" />
          <Tab label="Metadaten" id="document-tab-1" aria-controls="document-tabpanel-1" />
          <Tab 
            label="Workflow" 
            id="document-tab-2" 
            aria-controls="document-tabpanel-2"
            disabled={!document.currentWorkflow && availableWorkflows.length === 0}
          />
        </Tabs>
      </Box>
      
      {/* Dokument-Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={9}>
            <Paper 
              sx={{ 
                p: 2, 
                height: '70vh', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto'
              }}
            >
              {/* Hier würde in einer echten App ein PDF-Viewer sein */}
              <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DocumentIcon sx={{ fontSize: 120, color: 'text.secondary', opacity: 0.5 }} />
                </Box>
                <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                  Der PDF-Viewer wird in dieser Demo-Anwendung simuliert.
                </Typography>
                <Typography variant="body1" align="center">
                  Das Dokument {document.originalFilename} ({formatFileSize(document.size)}) 
                  würde hier angezeigt werden.
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dokumentinformationen
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Erstellt von" 
                    secondary={document.uploadedBy.name} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Erstelldatum" 
                    secondary={formatDate(document.createdAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DocumentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Dateiname" 
                    secondary={document.originalFilename} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Größe" 
                    secondary={formatFileSize(document.size)} 
                  />
                </ListItem>
              </List>
            </Paper>
            
            {document.tags && document.tags.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {document.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      icon={<LabelIcon style={{ fontSize: '1rem' }} />}
                    />
                  ))}
                </Box>
              </Paper>
            )}
            
            {!document.currentWorkflow && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Workflow
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<StartIcon />}
                  fullWidth
                  onClick={handleWorkflowClick}
                  disabled={document.status !== 'active'}
                >
                  Workflow starten
                </Button>
                
                <Menu
                  anchorEl={workflowAnchorEl}
                  open={Boolean(workflowAnchorEl)}
                  onClose={handleWorkflowClose}
                >
                  {availableWorkflows.map((workflow) => (
                    <MenuItem 
                      key={workflow._id}
                      onClick={() => {
                        handleSelectWorkflow(workflow);
                        handleOpenStartWorkflowDialog();
                      }}
                    >
                      <ListItemIcon>
                        <WorkflowIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>{workflow.name}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Metadaten-Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Allgemeine Informationen
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Titel:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.title}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Beschreibung:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.description || '-'}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Dokumenttyp:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{docType.label}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Status:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Chip
                    label={docStatus.label}
                    size="small"
                    sx={{
                      backgroundColor: `${docStatus.color}20`,
                      color: docStatus.color,
                      borderColor: docStatus.color,
                      fontWeight: 'medium'
                    }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Erstelldatum:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{formatDate(document.createdAt)}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Erstellt von:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.uploadedBy.name}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Postkorb:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.inbox ? document.inbox.name : '-'}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Version:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.version}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Dateieigenschaften
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Dateiname:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.originalFilename}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">MIME-Typ:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{document.mimeType}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Größe:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{formatFileSize(document.size)}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            {document.metadata && Object.keys(document.metadata).length > 0 && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Dokumentspezifische Metadaten
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(document.metadata).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2">{key}:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{value}</Typography>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
              </Paper>
            )}
            
            {document.tags && document.tags.length > 0 && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {document.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      icon={<LabelIcon style={{ fontSize: '1rem' }} />}
                    />
                  ))}
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Workflow-Tab */}
      <TabPanel value={tabValue} index={2}>
        {document.currentWorkflow ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Workflow-Verlauf
                </Typography>
                
                <Box sx={{ position: 'relative' }}>
                  {workflowHistory.map((entry, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        display: 'flex',
                        mb: 3,
                        position: 'relative'
                      }}
                    >
                      {/* Verbindungslinie */}
                      {index < workflowHistory.length - 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 20,
                            top: 40,
                            bottom: -20,
                            width: 2,
                            bgcolor: entry.status === 'completed' ? 'success.main' : 'grey.300',
                            zIndex: 0
                          }}
                        />
                      )}
                      
                      {/* Status-Icon */}
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: 
                            entry.status === 'completed' ? theme.palette.success.main :
                            entry.status === 'in_progress' ? theme.palette.info.main :
                            theme.palette.grey[300],
                          color: 'white',
                          zIndex: 1,
                          mr: 2
                        }}
                      >
                        {index + 1}
                      </Box>
                      
                      {/* Schritt-Informationen */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {entry.step}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          <Chip
                            label={
                              entry.status === 'completed' ? 'Abgeschlossen' :
                              entry.status === 'in_progress' ? 'In Bearbeitung' :
                              'Nicht gestartet'
                            }
                            size="small"
                            sx={{
                              backgroundColor: 
                                entry.status === 'completed' ? `${theme.palette.success.main}20` :
                                entry.status === 'in_progress' ? `${theme.palette.info.main}20` :
                                theme.palette.grey[100],
                              color: 
                                entry.status === 'completed' ? theme.palette.success.main :
                                entry.status === 'in_progress' ? theme.palette.info.main :
                                theme.palette.grey[600]
                            }}
                          />
                          
                          {entry.date && (
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(entry.date)}
                            </Typography>
                          )}
                          
                          {entry.user && (
                            <Typography variant="caption" color="text.secondary">
                              Benutzer: {entry.user}
                            </Typography>
                          )}
                        </Box>
                        
                        {entry.comment && (
                          <Typography variant="body2">
                            {entry.comment}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Workflow-Details
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <WorkflowIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Workflow" 
                      secondary={document.currentWorkflow.workflow.name} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Status" 
                      secondary={workflowStatus[document.currentWorkflow.status].label} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Gestartet am" 
                      secondary={formatDateTime(document.currentWorkflow.startedAt)} 
                    />
                  </ListItem>
                  {document.currentWorkflow.completedAt && (
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Abgeschlossen am" 
                        secondary={formatDateTime(document.currentWorkflow.completedAt)} 
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <WorkflowIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Kein aktiver Workflow
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Für dieses Dokument wurde noch kein Workflow gestartet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={handleWorkflowClick}
            >
              Workflow starten
            </Button>
          </Box>
        )}
      </TabPanel>
      
      {/* Dialoge */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Dokument löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie das Dokument "{document.title}" wirklich löschen?
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Abbrechen</Button>
          <Button onClick={handleDeleteDocument} color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={archiveDialogOpen}
        onClose={handleCloseArchiveDialog}
      >
        <DialogTitle>Dokument archivieren</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie das Dokument "{document.title}" archivieren?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseArchiveDialog}>Abbrechen</Button>
          <Button onClick={handleArchiveDocument} color="primary">
            Archivieren
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={startWorkflowDialogOpen}
        onClose={handleCloseStartWorkflowDialog}
      >
        <DialogTitle>Workflow starten</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Möchten Sie den Workflow "{selectedWorkflow?.name}" für das Dokument "{document.title}" starten?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dieser Workflow wird dem Dokument zugewiesen und durchläuft die konfigurierten Schritte.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStartWorkflowDialog}>Abbrechen</Button>
          <Button 
            onClick={handleStartWorkflow} 
            color="primary"
            disabled={!selectedWorkflow}
          >
            Workflow starten
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentView;