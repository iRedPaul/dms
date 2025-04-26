import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Archive as ArchiveIcon,
  FilterList as FilterIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  Receipt as InvoiceIcon,
  Assignment as ContractIcon,
  Assessment as ReportIcon,
  FileCopy as FormIcon,
  Folder as OtherIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../services/api';

// Dokument-Typen mit Icons
const documentTypes = {
  invoice: { icon: <InvoiceIcon />, label: 'Rechnung', color: '#ff9800' },
  contract: { icon: <ContractIcon />, label: 'Vertrag', color: '#2196f3' },
  report: { icon: <ReportIcon />, label: 'Bericht', color: '#4caf50' },
  form: { icon: <FormIcon />, label: 'Formular', color: '#9c27b0' },
  other: { icon: <OtherIcon />, label: 'Sonstiges', color: '#607d8b' }
};

// Generieren von Dummy-Archivdokumenten
const generateDummyArchiveDocuments = () => {
  const types = Object.keys(documentTypes);
  const archivedDocuments = [];
  
  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - Math.floor(Math.random() * 365));
    
    archivedDocuments.push({
      _id: `doc${i}`,
      title: `Archiviertes Dokument ${i}`,
      documentType: type,
      archivedAt: archiveDate,
      archivedBy: {
        name: ['Max Mustermann', 'Erika Musterfrau', 'John Doe'][Math.floor(Math.random() * 3)]
      },
      originalDate: new Date(
        archiveDate.getFullYear() - 1,
        archiveDate.getMonth(),
        archiveDate.getDate()
      ),
      size: Math.floor(Math.random() * 10000000) + 100000, // Zufällige Dateigröße
      category: ['Verträge', 'Rechnungen', 'Berichte', 'Personal', 'Sonstiges'][Math.floor(Math.random() * 5)]
    });
  }
  
  // Nach Datum sortieren (neueste zuerst)
  return archivedDocuments.sort((a, b) => b.archivedAt - a.archivedAt);
};

const Archive = () => {
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
    category: '',
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
    const fetchArchiveDocuments = async () => {
      try {
        // In einer realen App würden die Dokumente von der API geladen werden
        // const response = await api.get('/api/archive');
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyDocs = generateDummyArchiveDocuments();
          setDocuments(dummyDocs);
          setFilteredDocuments(dummyDocs);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der archivierten Dokumente:', error);
        setError('Fehler beim Laden der archivierten Dokumente. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchArchiveDocuments();
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
        doc.category.toLowerCase().includes(searchLower) ||
        doc.archivedBy.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Dokumenttyp-Filter
    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }
    
    // Kategorie-Filter
    if (filters.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }
    
    // Datumsbereich-Filter
    if (filters.dateRange.startDate) {
      const startDate = new Date(filters.dateRange.startDate);
      filtered = filtered.filter(doc => new Date(doc.archivedAt) >= startDate);
    }
    
    if (filters.dateRange.endDate) {
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(doc => new Date(doc.archivedAt) <= endDate);
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
      category: '',
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
  
  const handleRestoreDocument = () => {
    // Hier könnte ein API-Aufruf zum Wiederherstellen des Dokuments gemacht werden
    alert(`Dokument "${selectedDocument.title}" wurde wiederhergestellt`);
    handleActionClose();
  };
  
  const handleDeleteDocument = () => {
    // Hier könnte ein API-Aufruf zum endgültigen Löschen des Dokuments gemacht werden
    alert(`Dokument "${selectedDocument.title}" wurde endgültig gelöscht`);
    handleActionClose();
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
      <Box sx={{ color: docType.color, display: 'flex' }}>
        {docType.icon}
      </Box>
    );
  };
  
  // Kategorien für Filter
  const categories = ['Verträge', 'Rechnungen', 'Berichte', 'Personal', 'Sonstiges'];
  
  // Pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredDocuments.length - page * rowsPerPage);
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ArchiveIcon sx={{ fontSize: 30, mr: 1, color: theme.palette.warning.main }} />
          <Typography variant="h4">Archiv</Typography>
        </Box>
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
                  <InputLabel>Kategorie</InputLabel>
                  <Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    label="Kategorie"
                  >
                    <MenuItem value="">Alle Kategorien</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
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
              <Grid item xs={12} sm={6} md={3}>
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
                    <TableCell>Kategorie</TableCell>
                    <TableCell>Originaldatum</TableCell>
                    <TableCell>Archiviert am</TableCell>
                    <TableCell>Archiviert von</TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={doc.category}
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(doc.originalDate)}</TableCell>
                        <TableCell>{formatDate(doc.archivedAt)}</TableCell>
                        <TableCell>{doc.archivedBy.name}</TableCell>
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
                          <ArchiveIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Keine archivierten Dokumente gefunden
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
        <MenuItem onClick={handleRestoreDocument}>
          <ListItemIcon>
            <RestoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Wiederherstellen</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteDocument}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Endgültig löschen</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Archive;