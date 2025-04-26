import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Description as DocumentIcon,
  PlayArrow as StartIcon,
  Visibility as ViewIcon,
  ArrowForward as ArrowIcon,
  Archive as ArchiveIcon,
  People as PeopleIcon,
  Notifications as NotificationIcon,
  Receipt as InvoiceIcon,
  Assignment as ContractIcon,
  Assessment as ReportIcon,
  FileCopy as FormIcon,
  Folder as OtherIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
// Will be used for API calls in a real implementation
// import api from '../../services/api';

// Dokument-Typen mit Icons
const documentTypes = {
  invoice: { icon: <InvoiceIcon />, label: 'Rechnung', color: '#ff9800' },
  contract: { icon: <ContractIcon />, label: 'Vertrag', color: '#2196f3' },
  report: { icon: <ReportIcon />, label: 'Bericht', color: '#4caf50' },
  form: { icon: <FormIcon />, label: 'Formular', color: '#9c27b0' },
  other: { icon: <OtherIcon />, label: 'Sonstiges', color: '#607d8b' }
};

// Workflow-Status mit Farben
const workflowStatus = {
  not_started: { label: 'Nicht gestartet', color: '#9e9e9e' },
  in_progress: { label: 'In Bearbeitung', color: '#2196f3' },
  completed: { label: 'Abgeschlossen', color: '#4caf50' },
  canceled: { label: 'Abgebrochen', color: '#f44336' }
};

// Dummy-Daten für Postkörbe generieren
const generateDummyInboxData = (inboxId) => {
  // Postkorb-Informationen basierend auf ID
  const inboxes = {
    'inbox1': {
      _id: 'inbox1',
      name: 'Eingang',
      description: 'Allgemeiner Posteingang für neue Dokumente',
      type: 'department',
      assignedUsers: [
        { _id: 'user1', name: 'Max Mustermann' },
        { _id: 'user2', name: 'Erika Musterfrau' }
      ],
      documentCount: 28
    },
    'inbox2': {
      _id: 'inbox2',
      name: 'Rechnungswesen',
      description: 'Dokumente für die Buchhaltung und Finanzen',
      type: 'department',
      assignedUsers: [
        { _id: 'user3', name: 'Thomas Test' },
        { _id: 'user4', name: 'Sabine Schmidt' }
      ],
      documentCount: 15
    },
    'inbox3': {
      _id: 'inbox3',
      name: 'Vertrieb',
      description: 'Dokumente für den Vertrieb und Aufträge',
      type: 'department',
      assignedUsers: [
        { _id: 'user5', name: 'Peter Peters' },
        { _id: 'user6', name: 'Laura Lang' }
      ],
      documentCount: 22
    }
  };
  
  // Wenn die ID nicht existiert, Standardpostkorb verwenden
  const inbox = inboxes[inboxId] || inboxes['inbox1'];
  
  // Dokumente für den Postkorb generieren
  const documents = [];
  const types = Object.keys(documentTypes);
  
  for (let i = 1; i <= inbox.documentCount; i++) {
    const docType = types[Math.floor(Math.random() * types.length)];
    const hasWorkflow = Math.random() > 0.3;
    const workflowType = hasWorkflow 
      ? ['not_started', 'in_progress', 'completed'][Math.floor(Math.random() * 3)]
      : null;
    
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
    
    documents.push({
      _id: `doc${i}_${inboxId}`,
      title: `${documentTypes[docType].label} ${i} (${inbox.name})`,
      documentType: docType,
      createdAt: createdDate,
      uploadedBy: inbox.assignedUsers[Math.floor(Math.random() * inbox.assignedUsers.length)],
      size: Math.floor(Math.random() * 10000000) + 100000, // Zufällige Dateigröße
      currentWorkflow: hasWorkflow ? {
        status: workflowType,
        workflow: {
          _id: `workflow${Math.floor(Math.random() * 5) + 1}`,
          name: [
            'Rechnungsfreigabe', 
            'Vertragsfreigabe', 
            'Berichterstellung', 
            'Dokumentprüfung',
            'Genehmigungsprozess'
          ][Math.floor(Math.random() * 5)]
        }
      } : null
    });
  }
  
  // Nach Datum sortieren (neueste zuerst)
  return {
    inbox,
    documents: documents.sort((a, b) => b.createdAt - a.createdAt)
  };
};

// Beispiel-Workflows
const availableWorkflows = [
  { _id: 'workflow1', name: 'Rechnungsfreigabe' },
  { _id: 'workflow2', name: 'Vertragsfreigabe' },
  { _id: 'workflow3', name: 'Berichterstellung' },
  { _id: 'workflow4', name: 'Dokumentprüfung' },
  { _id: 'workflow5', name: 'Genehmigungsprozess' }
];

const InboxView = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  // Will be used for user-specific functionality in a real implementation
  const { user } = useContext(AuthContext);
  
  // State für Postkorb und Dokumente
  const [inbox, setInbox] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination-State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Such-/Filterstate
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Auswahl und Aktionen
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [docActionAnchorEl, setDocActionAnchorEl] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Workflow-Dialog
  const [workflowAnchorEl, setWorkflowAnchorEl] = useState(null);
  
  // Daten laden
  useEffect(() => {
    const fetchInboxData = async () => {
      try {
        // In einer realen App würden die Daten von der API geladen werden
        // const response = await api.get(`/api/inboxes/${id}/documents`);
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyData = generateDummyInboxData(id);
          setInbox(dummyData.inbox);
          setDocuments(dummyData.documents);
          setFilteredDocuments(dummyData.documents);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Postkorb-Daten:', error);
        setError('Fehler beim Laden der Postkorb-Daten. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchInboxData();
  }, [id]);
  
  // Dokumente filtern
  useEffect(() => {
    if (!documents.length) return;
    
    let filtered = [...documents];
    
    // Textsuche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        (doc.currentWorkflow?.workflow.name && doc.currentWorkflow.workflow.name.toLowerCase().includes(searchLower)) ||
        doc.uploadedBy.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Status-Filter
    if (activeFilter === 'no_workflow') {
      filtered = filtered.filter(doc => !doc.currentWorkflow);
    } else if (activeFilter === 'in_progress') {
      filtered = filtered.filter(doc => 
        doc.currentWorkflow && 
        ['not_started', 'in_progress'].includes(doc.currentWorkflow.status)
      );
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(doc => 
        doc.currentWorkflow && 
        doc.currentWorkflow.status === 'completed'
      );
    }
    
    setFilteredDocuments(filtered);
    setPage(0); // Zurück zur ersten Seite bei Filteränderung
  }, [documents, searchTerm, activeFilter]);
  
  // Filter-Handler
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    handleFilterClose();
  };
  
  // Such-Handler
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Pagination-Handler
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Dokument-Auswahl
  const handleSelectDoc = (doc) => {
    const isSelected = selectedDocs.some(d => d._id === doc._id);
    
    if (isSelected) {
      setSelectedDocs(selectedDocs.filter(d => d._id !== doc._id));
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };
  
  // Dokument-Aktionen
  const handleDocActionClick = (event, doc) => {
    event.stopPropagation();
    setDocActionAnchorEl(event.currentTarget);
    setSelectedDoc(doc);
  };
  
  const handleDocActionClose = () => {
    setDocActionAnchorEl(null);
    setSelectedDoc(null);
  };
  
  const handleViewDocument = () => {
    navigate(`/documents/${selectedDoc._id}`);
    handleDocActionClose();
  };
  
  // Workflow-Aktionen
  const handleWorkflowClick = (event) => {
    event.stopPropagation();
    setWorkflowAnchorEl(event.currentTarget);
  };
  
  const handleWorkflowClose = () => {
    setWorkflowAnchorEl(null);
  };
  
  const handleStartWorkflow = (workflow) => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.post(`/api/workflows/${workflow._id}/start/${selectedDoc._id}`);
    
    // Für Demo-Zwecke aktualisieren wir den Status lokal
    alert(`Workflow "${workflow.name}" für Dokument "${selectedDoc.title}" gestartet`);
    
    // Dokument aktualisieren
    const updatedDocs = documents.map(doc => {
      if (doc._id === selectedDoc._id) {
        return {
          ...doc,
          currentWorkflow: {
            status: 'not_started',
            workflow: {
              _id: workflow._id,
              name: workflow.name
            }
          }
        };
      }
      return doc;
    });
    
    setDocuments(updatedDocs);
    handleDocActionClose();
    handleWorkflowClose();
  };
  
  // Hilfsfunktionen
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd.MM.yyyy', { locale: de });
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Dokument-Icon basierend auf Typ rendern
  const renderDocumentTypeIcon = (type) => {
    const docType = documentTypes[type] || documentTypes.other;
    return (
      <Tooltip title={docType.label}>
        <Box sx={{ color: docType.color, display: 'flex' }}>
          {docType.icon}
        </Box>
      </Tooltip>
    );
  };
  
  // Workflow-Status-Chip rendern
  const renderWorkflowStatus = (doc) => {
    if (!doc.currentWorkflow) {
      return (
        <Chip
          label="Kein Workflow"
          size="small"
          variant="outlined"
          sx={{ color: theme.palette.text.secondary }}
        />
      );
    }
    
    const status = doc.currentWorkflow.status;
    const statusInfo = workflowStatus[status] || { label: status, color: '#757575' };
    
    return (
      <Box>
        <Typography variant="body2" noWrap>
          {doc.currentWorkflow.workflow.name}
        </Typography>
        <Chip
          label={statusInfo.label}
          size="small"
          sx={{
            backgroundColor: `${statusInfo.color}20`,
            color: statusInfo.color,
            fontWeight: 'medium'
          }}
        />
      </Box>
    );
  };
  
  // Prüfen, ob ein Dokument ausgewählt ist
  const isDocSelected = (docId) => selectedDocs.some(doc => doc._id === docId);
  
  // Paginierte Dokumente
  const paginatedDocs = filteredDocuments
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Leere Zeilen für Pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredDocuments.length - page * rowsPerPage);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Zurück zur Startseite
        </Button>
      </Box>
    );
  }
  
  if (!inbox) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Postkorb nicht gefunden
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Zurück zur Startseite
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InboxIcon sx={{ fontSize: 30, mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h4">{inbox.name}</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {inbox.description}
        </Typography>
      </Box>
      
      {/* Infoboxen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Dokumente</Typography>
              </Box>
              <Typography variant="h4">{documents.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Dokumente in diesem Postkorb
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Benutzer</Typography>
              </Box>
              <Typography variant="h4">{inbox.assignedUsers.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Zugewiesene Benutzer
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {inbox.assignedUsers.map((user) => (
                  <Chip
                    key={user._id}
                    label={user.name}
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <NotificationIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Aktivität</Typography>
              </Box>
              {/* Simulierte Aktivitätsdaten */}
              <Typography variant="body2" paragraph>
                <strong>Letzte Aktivität:</strong> {formatDate(new Date())}
              </Typography>
              <Typography variant="body2">
                <strong>Letzte Woche:</strong> {Math.floor(documents.length * 0.3)} neue Dokumente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Suchleiste und Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Dokumente durchsuchen..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              sx={{ mr: 1 }}
            >
              {activeFilter === 'all' ? 'Alle Dokumente' :
               activeFilter === 'no_workflow' ? 'Ohne Workflow' :
               activeFilter === 'in_progress' ? 'In Bearbeitung' :
               activeFilter === 'completed' ? 'Abgeschlossen' : 'Filter'}
            </Button>
            <Button
              variant="contained"
              startIcon={<ArrowIcon />}
              onClick={() => navigate('/documents/upload')}
            >
              Neues Dokument
            </Button>
            
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem 
                selected={activeFilter === 'all'}
                onClick={() => handleFilterChange('all')}
              >
                <ListItemIcon>
                  <DocumentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Alle Dokumente</ListItemText>
              </MenuItem>
              <MenuItem 
                selected={activeFilter === 'no_workflow'}
                onClick={() => handleFilterChange('no_workflow')}
              >
                <ListItemIcon>
                  <ArchiveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Ohne Workflow</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem 
                selected={activeFilter === 'in_progress'}
                onClick={() => handleFilterChange('in_progress')}
              >
                <ListItemIcon>
                  <StartIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>In Bearbeitung</ListItemText>
              </MenuItem>
              <MenuItem 
                selected={activeFilter === 'completed'}
                onClick={() => handleFilterChange('completed')}
              >
                <ListItemIcon>
                  <ArrowIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Abgeschlossen</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dokumententabelle */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 430px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell>Titel</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell>Erstellt von</TableCell>
                <TableCell>Workflow-Status</TableCell>
                <TableCell width={80}>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDocs.length > 0 ? (
                <>
                  {paginatedDocs.map((doc) => (
                    <TableRow
                      hover
                      key={doc._id}
                      selected={isDocSelected(doc._id)}
                      onClick={() => handleSelectDoc(doc)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        {renderDocumentTypeIcon(doc.documentType)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {doc.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(doc.size)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      <TableCell>{doc.uploadedBy.name}</TableCell>
                      <TableCell>{renderWorkflowStatus(doc)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title="Dokument anzeigen">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/documents/${doc._id}`);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleDocActionClick(e, doc)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <DocumentIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        Keine Dokumente gefunden
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dieser Postkorb enthält keine Dokumente, die den Filterkriterien entsprechen.
                      </Typography>
                      {activeFilter !== 'all' && (
                        <Button 
                          variant="outlined"
                          onClick={() => handleFilterChange('all')}
                          sx={{ mt: 2 }}
                        >
                          Alle Dokumente anzeigen
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDocuments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Zeilen pro Seite:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} von ${count !== -1 ? count : `mehr als ${to}`}`
          }
        />
      </Paper>
      
      {/* Dokument-Aktionsmenü */}
      <Menu
        anchorEl={docActionAnchorEl}
        open={Boolean(docActionAnchorEl)}
        onClose={handleDocActionClose}
      >
        <MenuItem onClick={handleViewDocument}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dokument anzeigen</ListItemText>
        </MenuItem>
        
        {selectedDoc && !selectedDoc.currentWorkflow && (
          <MenuItem onClick={handleWorkflowClick}>
            <ListItemIcon>
              <StartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Workflow starten</ListItemText>
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleDocActionClose}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Aus Postkorb entfernen</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Workflow-Auswahlmenü */}
      <Menu
        anchorEl={workflowAnchorEl}
        open={Boolean(workflowAnchorEl)}
        onClose={handleWorkflowClose}
      >
        {availableWorkflows.map((workflow) => (
          <MenuItem 
            key={workflow._id}
            onClick={() => handleStartWorkflow(workflow)}
          >
            <ListItemIcon>
              <StartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{workflow.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default InboxView;
