import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme
} from '@mui/material';
import {
  Task as TaskIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  AccessTime as TimeIcon,
  PriorityHigh as HighPriorityIcon,
  CheckCircle,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Receipt as InvoiceIcon,
  Assignment as ContractIcon,
  Assessment as ReportIcon,
  FileCopy as FormIcon,
  Folder as OtherIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { format, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

// Dokument-Typen mit Icons
const documentTypes = {
  invoice: { icon: <InvoiceIcon />, label: 'Rechnung', color: '#ff9800' },
  contract: { icon: <ContractIcon />, label: 'Vertrag', color: '#2196f3' },
  report: { icon: <ReportIcon />, label: 'Bericht', color: '#4caf50' },
  form: { icon: <FormIcon />, label: 'Formular', color: '#9c27b0' },
  other: { icon: <OtherIcon />, label: 'Sonstiges', color: '#607d8b' }
};

// Aufgabenstatus-Definitionen
const taskStatus = {
  pending: { label: 'Ausstehend', color: '#757575' },
  in_progress: { label: 'In Bearbeitung', color: '#2196f3' },
  completed: { label: 'Abgeschlossen', color: '#4caf50' },
  rejected: { label: 'Abgelehnt', color: '#f44336' },
  overdue: { label: 'Überfällig', color: '#d32f2f' }
};

// Prioritäts-Definitionen
const priorities = {
  low: { label: 'Niedrig', color: '#757575' },
  medium: { label: 'Mittel', color: '#ff9800' },
  high: { label: 'Hoch', color: '#f44336' }
};

// Tab-Panels
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tasks-tabpanel-${index}`}
      aria-labelledby={`tasks-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Generieren von Dummy-Aufgaben
const generateDummyTasks = () => {
  const tasks = [];
  const types = Object.keys(documentTypes);
  const taskTypes = ['approve', 'review', 'sign', 'process'];
  const priorityLevels = ['low', 'medium', 'high'];
  
  // Commented out as it was unused
  // const now = new Date();
  
  for (let i = 1; i <= 30; i++) {
    const docType = types[Math.floor(Math.random() * types.length)];
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const priority = priorityLevels[Math.floor(Math.random() * priorityLevels.length)];
    
    // Für die Demo: Die ersten 20 Aufgaben sind aktiv, der Rest ist abgeschlossen
    const isActive = i <= 20;
    const status = isActive 
      ? (i % 5 === 0 ? 'in_progress' : 'pending')
      : (Math.random() > 0.3 ? 'completed' : 'rejected');
    
    // Zufälliges Zuweisungsdatum (1-30 Tage in der Vergangenheit)
    const assignedDate = new Date();
    assignedDate.setDate(assignedDate.getDate() - Math.floor(Math.random() * 30));
    
    // Zufälliges Fälligkeitsdatum
    const dueDate = new Date(assignedDate);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 3);
    
    // Zufälliges Abschlussdatum für abgeschlossene Aufgaben
    let completedDate = null;
    if (status === 'completed' || status === 'rejected') {
      completedDate = new Date(assignedDate);
      completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 5) + 1);
    }
    
    const task = {
      _id: `task${i}`,
      title: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} ${docType} ${i}`,
      description: `Diese Aufgabe erfordert, dass Sie das ${documentTypes[docType].label} überprüfen und ${
        taskType === 'approve' ? 'genehmigen' : 
        taskType === 'review' ? 'prüfen' : 
        taskType === 'sign' ? 'unterschreiben' : 
        'verarbeiten'
      }.`,
      document: {
        _id: `doc${i}`,
        title: `${documentTypes[docType].label} ${i}`,
        documentType: docType
      },
      workflow: {
        _id: `workflow${i % 5 + 1}`,
        name: [
          'Rechnungsfreigabe', 
          'Vertragsfreigabe', 
          'Berichterstellung', 
          'Dokumentprüfung',
          'Genehmigungsprozess'
        ][i % 5]
      },
      assignedTo: {
        _id: 'currentUser',
        name: 'Max Mustermann',
        username: 'max'
      },
      assignedBy: {
        _id: 'admin',
        name: 'Admin User',
        username: 'admin'
      },
      status,
      priority,
      assignedAt: assignedDate,
      dueDate,
      completedAt: completedDate,
      comments: []
    };
    
    // Einige Kommentare für abgeschlossene Aufgaben hinzufügen
    if (status === 'completed' || status === 'rejected') {
      const commentCount = Math.floor(Math.random() * 3);
      for (let j = 0; j < commentCount; j++) {
        const commentDate = new Date(assignedDate);
        commentDate.setDate(commentDate.getDate() + Math.floor(Math.random() * 3) + 1);
        
        task.comments.push({
          _id: `comment${i}_${j}`,
          text: `Das ist ein Beispielkommentar zur Aufgabe #${j+1}.`,
          createdBy: {
            _id: j % 2 === 0 ? 'currentUser' : 'admin',
            name: j % 2 === 0 ? 'Max Mustermann' : 'Admin User'
          },
          createdAt: commentDate
        });
      }
      
      // Abschlusskommentar hinzufügen
      if (status === 'completed') {
        task.comments.push({
          _id: `comment${i}_final`,
          text: 'Aufgabe abgeschlossen. Dokument wurde genehmigt.',
          createdBy: {
            _id: 'currentUser',
            name: 'Max Mustermann'
          },
          createdAt: completedDate
        });
      } else if (status === 'rejected') {
        task.comments.push({
          _id: `comment${i}_final`,
          text: 'Aufgabe abgelehnt. Dokument erfordert weitere Überarbeitung.',
          createdBy: {
            _id: 'currentUser',
            name: 'Max Mustermann'
          },
          createdAt: completedDate
        });
      }
    }
    
    tasks.push(task);
  }
  
  return tasks;
};

const WorkflowTasks = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  // Added comment to indicate intended usage
  const { user } = useContext(AuthContext); // Will be used for user-specific tasks in a real implementation
  
  // Tab-State
  const [tabValue, setTabValue] = useState(0);
  
  // Tasks-State
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination-State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Aktions-States
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Dialog-States
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Aufgaben laden
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // In einer realen App würden die Aufgaben von der API geladen werden
        // const response = await api.get('/api/tasks');
        
        // Für Demo-Zwecke verwenden wir Dummy-Daten
        setTimeout(() => {
          const dummyTasks = generateDummyTasks();
          
          // Überfällige Aufgaben markieren
          const tasksWithOverdueStatus = dummyTasks.map(task => {
            if (task.status === 'pending' || task.status === 'in_progress') {
              const now = new Date();
              if (task.dueDate && isBefore(new Date(task.dueDate), now)) {
                return { ...task, status: 'overdue' };
              }
            }
            return task;
          });
          
          setTasks(tasksWithOverdueStatus);
          setFilteredTasks(tasksWithOverdueStatus);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Aufgaben:', error);
        setError('Fehler beim Laden der Aufgaben. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
  // Nach Tab-Wechsel filtern
  useEffect(() => {
    if (!tasks.length) return;
    
    if (tabValue === 0) {
      // Aktive Aufgaben (pending, in_progress, overdue)
      setFilteredTasks(
        tasks.filter(task => 
          ['pending', 'in_progress', 'overdue'].includes(task.status)
        )
      );
    } else if (tabValue === 1) {
      // Abgeschlossene Aufgaben (completed, rejected)
      setFilteredTasks(
        tasks.filter(task => 
          ['completed', 'rejected'].includes(task.status)
        )
      );
    }
    
    setPage(0); // Zurück zur ersten Seite bei Tab-Wechsel
  }, [tabValue, tasks]);
  
  // Tab-Handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Pagination-Handler
  const handleChangePage = (event, newValue) => {
    setPage(newValue);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Aktions-Handler
  const handleActionClick = (event, task) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };
  
  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedTask(null);
  };
  
  const handleViewDocument = () => {
    navigate(`/documents/${selectedTask.document._id}`);
    handleActionClose();
  };
  
  const handleOpenApproveDialog = () => {
    setApproveDialogOpen(true);
    handleActionClose();
  };
  
  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setCommentText('');
  };
  
  const handleOpenRejectDialog = () => {
    setRejectDialogOpen(true);
    handleActionClose();
  };
  
  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setCommentText('');
  };
  
  const handleCommentChange = (event) => {
    setCommentText(event.target.value);
  };
  
  const handleApproveTask = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/tasks/${selectedTask._id}/approve`, { comment: commentText });
    
    // Für Demo-Zwecke aktualisieren wir den Status lokal
    const now = new Date();
    
    // Aktualisierte Aufgabe
    const updatedTask = {
      ...selectedTask,
      status: 'completed',
      completedAt: now,
      comments: [
        ...selectedTask.comments,
        {
          _id: `comment_approve_${Date.now()}`,
          text: commentText || 'Aufgabe genehmigt.',
          createdBy: {
            _id: 'currentUser',
            name: 'Max Mustermann'
          },
          createdAt: now
        }
      ]
    };
    
    // Tasks aktualisieren
    setTasks(tasks.map(task => 
      task._id === selectedTask._id ? updatedTask : task
    ));
    
    // Dialog schließen
    handleCloseApproveDialog();
    
    // Erfolgsmeldung
    alert('Aufgabe erfolgreich genehmigt!');
  };
  
  const handleRejectTask = () => {
    // In einer realen App würde hier ein API-Aufruf gemacht werden
    // await api.put(`/api/tasks/${selectedTask._id}/reject`, { comment: commentText });
    
    // Für Demo-Zwecke aktualisieren wir den Status lokal
    const now = new Date();
    
    // Aktualisierte Aufgabe
    const updatedTask = {
      ...selectedTask,
      status: 'rejected',
      completedAt: now,
      comments: [
        ...selectedTask.comments,
        {
          _id: `comment_reject_${Date.now()}`,
          text: commentText || 'Aufgabe abgelehnt.',
          createdBy: {
            _id: 'currentUser',
            name: 'Max Mustermann'
          },
          createdAt: now
        }
      ]
    };
    
    // Tasks aktualisieren
    setTasks(tasks.map(task => 
      task._id === selectedTask._id ? updatedTask : task
    ));
    
    // Dialog schließen
    handleCloseRejectDialog();
    
    // Erfolgsmeldung
    alert('Aufgabe abgelehnt!');
  };
  
  // Hilfsfunktionen
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy', { locale: de });
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };
  
  // Status-Chip rendern
  const renderStatusChip = (status) => {
    const taskStatusInfo = taskStatus[status] || { label: status, color: '#757575' };
    return (
      <Chip
        label={taskStatusInfo.label}
        size="small"
        sx={{
          backgroundColor: `${taskStatusInfo.color}20`,
          color: taskStatusInfo.color,
          borderColor: taskStatusInfo.color,
          fontWeight: 'medium'
        }}
        variant="outlined"
      />
    );
  };
  
  // Prioritäts-Chip rendern
  const renderPriorityChip = (priority) => {
    const priorityInfo = priorities[priority] || { label: priority, color: '#757575' };
    const icon = priority === 'high' ? <HighPriorityIcon fontSize="small" /> : null;
    return (
      <Chip
        icon={icon}
        label={priorityInfo.label}
        size="small"
        sx={{
          backgroundColor: `${priorityInfo.color}20`,
          color: priorityInfo.color,
          fontWeight: 'medium'
        }}
      />
    );
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
  
  // Status-Icon basierend auf Status rendern
  const renderStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ color: taskStatus.completed.color }} />;
      case 'rejected':
        return <RejectedIcon sx={{ color: taskStatus.rejected.color }} />;
      case 'in_progress':
        return <TaskIcon sx={{ color: taskStatus.in_progress.color }} />;
      case 'overdue':
        return <TimeIcon sx={{ color: taskStatus.overdue.color }} />;
      default:
        return <PendingIcon sx={{ color: taskStatus.pending.color }} />;
    }
  };
  
  // Fälligkeitsanzeige rendern
  const renderDueDate = (task) => {
    if (!task.dueDate) return '-';
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    // Für abgeschlossene Aufgaben
    if (task.status === 'completed' || task.status === 'rejected') {
      return formatDate(task.dueDate);
    }
    
    // Überfällig
    if (isBefore(dueDate, now)) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2" color="error">
            Überfällig seit {formatDate(task.dueDate)}
          </Typography>
        </Box>
      );
    }
    
    // Bald fällig (in den nächsten 2 Tagen)
    if (isBefore(dueDate, addDays(now, 2))) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
          <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2" color="warning.main">
            Fällig am {formatDate(task.dueDate)}
          </Typography>
        </Box>
      );
    }
    
    // Normal
    return formatDate(task.dueDate);
  };
  
  // Paginierte Aufgaben
  const paginatedTasks = filteredTasks
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Leere Zeilen für Pagination
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredTasks.length - page * rowsPerPage);
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TaskIcon sx={{ fontSize: 30, mr: 1, color: theme.palette.info.main }} />
          <Typography variant="h4">Meine Aufgaben</Typography>
        </Box>
      </Box>
      
      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TaskIcon sx={{ mr: 1 }} />
                <span>Aktive Aufgaben</span>
                {filteredTasks.length > 0 && tabValue === 0 && (
                  <Chip
                    label={filteredTasks.length}
                    size="small"
                    sx={{ ml: 1, minWidth: 30 }}
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 1 }} />
                <span>Abgeschlossene Aufgaben</span>
              </Box>
            } 
          />
        </Tabs>
        
        {/* Aktive Aufgaben */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell>Aufgabe</TableCell>
                    <TableCell>Dokument</TableCell>
                    <TableCell>Workflow</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priorität</TableCell>
                    <TableCell>Fälligkeit</TableCell>
                    <TableCell width={100}>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTasks.length > 0 ? (
                    <>
                      {paginatedTasks.map((task) => (
                        <TableRow
                          hover
                          key={task._id}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            {renderStatusIcon(task.status)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Zugewiesen am {formatDate(task.assignedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {renderDocumentTypeIcon(task.document.documentType)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {task.document.title}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{task.workflow.name}</TableCell>
                          <TableCell>{renderStatusChip(task.status)}</TableCell>
                          <TableCell>{renderPriorityChip(task.priority)}</TableCell>
                          <TableCell>{renderDueDate(task)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex' }}>
                              <Tooltip title="Dokument anzeigen">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/documents/${task.document._id}`)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <IconButton
                                size="small"
                                onClick={(e) => handleActionClick(e, task)}
                              >
                                <MoreIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                      {emptyRows > 0 && (
                        <TableRow style={{ height: 53 * emptyRows }}>
                          <TableCell colSpan={8} />
                        </TableRow>
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <TaskIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Keine aktiven Aufgaben
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Alle Ihre Aufgaben wurden erledigt!
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Zeilen pro Seite:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} von ${count !== -1 ? count : `mehr als ${to}`}`
            }
          />
        </TabPanel>
        
        {/* Abgeschlossene Aufgaben */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell>Aufgabe</TableCell>
                    <TableCell>Dokument</TableCell>
                    <TableCell>Workflow</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Erledigt am</TableCell>
                    <TableCell>Kommentare</TableCell>
                    <TableCell width={70}>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTasks.length > 0 ? (
                    <>
                      {paginatedTasks.map((task) => (
                        <TableRow
                          hover
                          key={task._id}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            {renderStatusIcon(task.status)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Zugewiesen am {formatDate(task.assignedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {renderDocumentTypeIcon(task.document.documentType)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {task.document.title}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{task.workflow.name}</TableCell>
                          <TableCell>{renderStatusChip(task.status)}</TableCell>
                          <TableCell>{formatDate(task.completedAt)}</TableCell>
                          <TableCell>
                            {task.comments.length > 0 ? (
                              <Chip
                                icon={<CommentIcon />}
                                label={`${task.comments.length} Kommentar${task.comments.length !== 1 ? 'e' : ''}`}
                                size="small"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Keine Kommentare
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleActionClick(e, task)}
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
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <CheckCircle sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Keine abgeschlossenen Aufgaben
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Alle Ihre Aufgaben sind noch in Bearbeitung.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Zeilen pro Seite:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} von ${count !== -1 ? count : `mehr als ${to}`}`
            }
          />
        </TabPanel>
      </Paper>
      
      {/* Aktionen-Menü */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleViewDocument}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dokument anzeigen</ListItemText>
        </MenuItem>
        
        {selectedTask && ['pending', 'in_progress', 'overdue'].includes(selectedTask.status) && (
          <>
            <MenuItem onClick={handleOpenApproveDialog}>
              <ListItemIcon>
                <ApproveIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Genehmigen</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleOpenRejectDialog}>
              <ListItemIcon>
                <RejectIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Ablehnen</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Genehmigungs-Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={handleCloseApproveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aufgabe genehmigen</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Möchten Sie die folgende Aufgabe genehmigen?
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            {selectedTask?.title}
          </Typography>
          <Typography paragraph>
            Dokument: {selectedTask?.document.title}
          </Typography>
          <TextField
            fullWidth
            label="Kommentar (optional)"
            multiline
            rows={3}
            value={commentText}
            onChange={handleCommentChange}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog}>Abbrechen</Button>
          <Button onClick={handleApproveTask} color="primary" variant="contained">
            Genehmigen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Ablehnungs-Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleCloseRejectDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aufgabe ablehnen</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Möchten Sie die folgende Aufgabe ablehnen?
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            {selectedTask?.title}
          </Typography>
          <Typography paragraph>
            Dokument: {selectedTask?.document.title}
          </Typography>
          <TextField
            fullWidth
            label="Ablehnungsgrund (empfohlen)"
            multiline
            rows={3}
            value={commentText}
            onChange={handleCommentChange}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Abbrechen</Button>
          <Button onClick={handleRejectTask} color="error" variant="contained">
            Ablehnen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowTasks;
