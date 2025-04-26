import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon,
  Description as DocumentIcon,
  Receipt as InvoiceIcon,
  Assignment as ContractIcon,
  Assessment as ReportIcon,
  FileCopy as FormIcon,
  Folder as OtherIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

// Dummy-Daten für Dokumente (kann später durch API-Daten ersetzt werden)
const generateDummyDocuments = () => {
  const dummyDocuments = [];
  const types = Object.keys(documentTypes);
  const status = Object.keys(documentStatus);
  
  for (let i = 1; i <= 35; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const randomStatus = i <= 30 ? 'active' : status[Math.floor(Math.random() * status.length)];
    
    dummyDocuments.push({
      _id: `doc${i}`,
      title: `Dokument ${i}`,
      documentType: type,
      status: randomStatus,
      createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      uploadedBy: {
        name: 'Max Mustermann'
      },
      size: Math.floor(Math.random() * 10000000) + 100000, // Zufällige Dateigröße
      currentWorkflow: Math.random() > 0.5 ? {
        status: ['not_started', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
        workflow: {
          name: ['Rechnungsfreigabe', 'Vertragsfreigabe', 'Berichterstellung'][Math.floor(Math.random() * 3)]
        }
      } : null,
      inbox: Math.random() > 0.7 ? {
        name: ['Eingang', 'Rechnungswesen', 'Vertrieb'][Math.floor(Math.random() * 3)]
      } : null
    });
  }
  
  return dummyDocuments;
};

const DocumentList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State für Dokumente und Filterung
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State für Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State für Filter und Suche
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    documentType: '',
    status: '',
    inboxId: '',
    dateRange: {
      startDate: '',
      endDate: ''
    }
  });
  
  // State für Filter-Menu
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // State für Aktionsmenu
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Dokumente laden
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // In einer realen App würden die Dokumente von der API geladen werden
        // api.get('/api/documents')...
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyDocs = generateDummyDocuments();
          setDocuments(dummyDocs);
          setFilteredDocuments(dummyDocs);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Dokumente:', error);
        setError('Fehler beim Laden der Dokumente. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
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
        (doc.inbox?.name && doc.inbox.name.toLowerCase().includes(searchLower)) ||
        doc.uploadedBy.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Dokumenttyp-Filter
    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }
    
    // Status-Filter
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    
    // Postkorb-Filter
    if (filters.inboxId) {
      filtered = filtered.filter(doc => doc.inbox && doc.inbox.name === filters.inboxId);
    }
    
    // Datumsbereich-Filter
    if (filters.dateRange.startDate) {
      const startDate = new Date(filters.dateRange.startDate);
      filtered = filtered.filter(doc => new Date(doc.createdAt) >= startDate);
    }
    
    if (filters.dateRange.endDate) {
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(doc => new Date(doc.createdAt) <= endDate);
    }
    
    setFilteredDocuments(filtered);
    setPage(0); // Zurück zur ersten Seite bei Filteränderung
  }, [documents, searchTerm, filters]);
  
  // Pagination-Handler
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Such-Handler
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Filter-Handler
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleShowFilters = () => {
    setShowFilters(!showFilters);
    handleFilterClose();
  };
  
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    
    if (name.startsWith('dateRange.')) {
      const dateField = name.split('.')[1];
      setFilters({
        ...filters,
        dateRange: {
          ...filters.dateRange,
          [dateField]: value
        }
      });
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };
  
  const handleClearFilters = () => {
    setFilters({
      documentType: '',
      status: '',
      inboxId: '',
      dateRange: {
        startDate: '',
        endDate: ''
      }
    });
    setSearchTerm('');
  };
  
  // Dokumentaktionen-Handler
  const handleActionClick = (event, doc) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedDocument(doc);
  };
  
  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedDocument(null);
  };
  
  const handleViewDocument = () => {
    navigate(`/documents/${selectedDocument._id}`);
    handleActionClose();
  };
  
  const handleEditDocument = () => {
    // Hier könnte zur Bearbeitungsseite navigiert werden
    alert(`Dokument "${selectedDocument.title}" bearbeiten`);
    handleActionClose();
  };
  
  const handleArchiveDocument = () => {
    // Hier könnte ein API-Aufruf zum Archivieren des Dokuments gemacht werden
    alert(`Dokument "${selectedDocument.title}" archivieren`);
    handleActionClose();
  };
  
  const handleDeleteDocument = () => {
    // Hier könnte ein API-Aufruf zum Löschen des Dokuments gemacht werden
    alert(`Dokument "${selectedDocument.title}" löschen`);
    handleActionClose();
  };
  
  // Hilfsfunktion für die Formatierung der Dateigröße
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Formatierung der Datumsangaben
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd.MM.yyyy', { locale: de });
    } catch (error) {
      return 'Ungültiges Datum';
    }
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
  
  // Status-Chip basierend auf Status rendern
  const renderStatusChip = (status) => {
    const docStatus = documentStatus[status] || { label: status, color: '#9e9e9e' };
    return (
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
    );
  };
  
  // Pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredDocuments.length - page * rowsPerPage);
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Dokumente</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/documents/upload')}
        >
          Neues Dokument
        </Button>
      </Box>
      
      {/* Suchleiste und Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Suchen..."
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
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              startIcon={<FilterIcon />}
              variant="outlined"
              onClick={handleFilterClick}
              sx={{ ml: 1 }}
            >
              Filter
            </Button>
            
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={handleShowFilters}>
                <ListItemIcon>
                  <FilterIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Filter anzeigen/ausblenden</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleClearFilters}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Filter zurücksetzen</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
        
        {/* Erweiterte Filter */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dokumenttyp</InputLabel>
                  <Select
                    name="documentType"
                    value={filters.documentType}
                    onChange={handleFilterChange}
                    label="Dokumenttyp"
                  >
                    <MenuItem value="">Alle Typen</MenuItem>
                    {Object.entries(documentTypes).map(([key, { label }]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">Alle Status</MenuItem>
                    {Object.entries(documentStatus).map(([key, { label }]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Postkorb</InputLabel>
                  <Select
                    name="inboxId"
                    value={filters.inboxId}
                    onChange={handleFilterChange}
                    label="Postkorb"
                  >
                    <MenuItem value="">Alle Postkörbe</MenuItem>
                    <MenuItem value="Eingang">Eingang</MenuItem>
                    <MenuItem value="Rechnungswesen">Rechnungswesen</MenuItem>
                    <MenuItem value="Vertrieb">Vertrieb</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Von"
                      type="date"
                      name="dateRange.startDate"
                      value={filters.dateRange.startDate}
                      onChange={handleFilterChange}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Bis"
                      type="date"
                      name="dateRange.endDate"
                      value={filters.dateRange.endDate}
                      onChange={handleFilterChange}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Dokumententabelle */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell>Titel</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Datum</TableCell>
                    <TableCell>Workflow</TableCell>
                    <TableCell>Postkorb</TableCell>
                    <TableCell>Größe</TableCell>
                    <TableCell width={70}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((doc) => (
                      <TableRow
                        hover
                        key={doc._id}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => navigate(`/documents/${doc._id}`)}
                      >
                        <TableCell padding="checkbox">
                          {renderDocumentTypeIcon(doc.documentType)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {doc.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.uploadedBy.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{renderStatusChip(doc.status)}</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell>
                          {doc.currentWorkflow ? (
                            <Box>
                              <Typography variant="body2">
                                {doc.currentWorkflow.workflow.name}
                              </Typography>
                              <Chip
                                label={
                                  doc.currentWorkflow.status === 'not_started' ? 'Nicht gestartet' :
                                  doc.currentWorkflow.status === 'in_progress' ? 'In Bearbeitung' :
                                  doc.currentWorkflow.status === 'completed' ? 'Abgeschlossen' :
                                  doc.currentWorkflow.status === 'canceled' ? 'Abgebrochen' :
                                  doc.currentWorkflow.status
                                }
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  backgroundColor: 
                                    doc.currentWorkflow.status === 'completed' ? `${theme.palette.success.main}20` :
                                    doc.currentWorkflow.status === 'in_progress' ? `${theme.palette.info.main}20` :
                                    doc.currentWorkflow.status === 'not_started' ? `${theme.palette.warning.main}20` :
                                    doc.currentWorkflow.status === 'canceled' ? `${theme.palette.error.main}20` :
                                    'default'
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.inbox ? (
                            <Typography variant="body2">
                              {doc.inbox.name}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatFileSize(doc.size)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(e, doc);
                            }}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                  
                  {filteredDocuments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <DocumentIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Keine Dokumente gefunden
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Versuchen Sie, Ihre Suchkriterien anzupassen
                          </Typography>
                          <Button 
                            variant="outlined"
                            onClick={handleClearFilters}
                            sx={{ mt: 2 }}
                          >
                            Filter zurücksetzen
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
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
          </>
        )}
      </Paper>
      
      {/* Aktionsmenü für Dokumente */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleViewDocument}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Anzeigen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditDocument}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleArchiveDocument}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archivieren</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteDocument}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Löschen</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentList;