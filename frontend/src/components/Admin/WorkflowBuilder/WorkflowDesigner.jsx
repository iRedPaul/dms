import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap
} from 'react-flow-renderer';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Import der benutzerdefinierten Knotentypen
import StepNodes from './WorkflowNodeTypes';
import WorkflowProperties from './WorkflowProperties';
import api from '../../../services/api';

// Sidepanel für Knotenauswahl und -eigenschaften
const Sidebar = ({ onDragStart }) => {
  const nodeTypes = [
    { type: 'upload', label: 'Dokument-Upload', description: 'Erlaubt das Hochladen neuer Dokumente' },
    { type: 'form', label: 'Formular', description: 'Felder für die Dateneingabe' },
    { type: 'approval', label: 'Genehmigung', description: 'Genehmigungsschritt durch einen Benutzer' },
    { type: 'notification', label: 'Benachrichtigung', description: 'Sendet Benachrichtigungen an Benutzer' },
    { type: 'condition', label: 'Bedingung', description: 'Verzweigung basierend auf Bedingungen' },
    { type: 'archive', label: 'Archivierung', description: 'Archiviert Dokumente' }
  ];

  return (
    <Box sx={{ p: 2, borderRight: 1, borderColor: 'divider', width: 250, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Workflow-Elemente
      </Typography>
      <Grid container spacing={1} direction="column">
        {nodeTypes.map((node) => (
          <Grid item key={node.type}>
            <Paper
              sx={{
                p: 2,
                cursor: 'grab',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
              elevation={2}
              onDragStart={(e) => onDragStart(e, node.type)}
              draggable
            >
              <Typography variant="subtitle1">{node.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {node.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const initialNodes = [];
const initialEdges = [];

const WorkflowDesigner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    documentType: 'any',
    isActive: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Knotentypen initialisieren
  const nodeTypes = StepNodes;

  // Workflow aus der API laden
  const loadWorkflow = useCallback(async (workflowId) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/workflows/${workflowId}`);
      const workflowData = response.data;
      
      setWorkflow({
        name: workflowData.name,
        description: workflowData.description,
        documentType: workflowData.documentType,
        isActive: workflowData.isActive
      });

      // Knoten aus den Workflow-Schritten erstellen
      const flowNodes = workflowData.steps.map((step, index) => ({
        id: `${index}`,
        type: step.type,
        position: step.position || { x: 100 + index * 200, y: 100 },
        data: {
          label: step.name,
          step
        }
      }));

      // Verbindungen aus den Workflow-Verbindungen erstellen
      const flowEdges = workflowData.connections.map((conn, index) => ({
        id: `e${index}`,
        source: `${conn.source.stepIndex}`,
        target: `${conn.target.stepIndex}`,
        sourceHandle: conn.source.connector,
        targetHandle: conn.target.connector
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Fehler beim Laden des Workflows:', error);
      setError('Der Workflow konnte nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  // Workflow laden, wenn ID vorhanden
  useEffect(() => {
    if (id && id !== 'new') {
      loadWorkflow(id);
    }
  }, [id, loadWorkflow]);

  // Verbindungen zwischen Knoten hinzufügen
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Elemente per Drag & Drop hinzufügen
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode = {
        id: `${nodes.length}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
          step: {
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
            type,
            description: '',
            assignedTo: { type: 'role', value: '' },
            position
          }
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes, setNodes]
  );

  // Knoten auswählen
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Daten des ausgewählten Knotens aktualisieren
  const updateNodeData = (updatedData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: updatedData.name,
              step: updatedData
            }
          };
        }
        return node;
      })
    );
  };

  // Knoten entfernen
  const removeNode = () => {
    if (!selectedNode) return;

    // Alle mit dem Knoten verbundenen Kanten entfernen
    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );

    // Knoten entfernen
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    
    // Auswahl zurücksetzen
    setSelectedNode(null);
  };

  // Workflow speichern
  const saveWorkflow = async () => {
    try {
      setIsLoading(true);

      // Workflow-Schritte aus den Knoten extrahieren
      const steps = nodes.map((node) => ({
        ...node.data.step,
        position: node.position
      }));

      // Workflow-Verbindungen aus den Kanten extrahieren
      const connections = edges.map((edge) => ({
        source: {
          stepIndex: parseInt(edge.source),
          connector: edge.sourceHandle || 'default'
        },
        target: {
          stepIndex: parseInt(edge.target),
          connector: edge.targetHandle || 'default'
        }
      }));

      const workflowData = {
        ...workflow,
        steps,
        connections
      };

      let response;
      if (id && id !== 'new') {
        // Bestehenden Workflow aktualisieren
        response = await api.put(`/api/workflows/${id}`, workflowData);
        setSuccess('Workflow erfolgreich aktualisiert');
      } else {
        // Neuen Workflow erstellen
        response = await api.post('/api/workflows', workflowData);
        setSuccess('Workflow erfolgreich erstellt');
        navigate(`/admin/workflows/${response.data._id}`);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Workflows:', error);
      setError(error.response?.data?.message || 'Der Workflow konnte nicht gespeichert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag-Start-Event für das Hinzufügen neuer Knoten
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Workflow-Name"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              required
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Beschreibung"
              value={workflow.description}
              onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="document-type-label">Dokumententyp</InputLabel>
              <Select
                labelId="document-type-label"
                value={workflow.documentType}
                label="Dokumententyp"
                onChange={(e) => setWorkflow({ ...workflow, documentType: e.target.value })}
              >
                <MenuItem value="any">Beliebig</MenuItem>
                <MenuItem value="invoice">Rechnung</MenuItem>
                <MenuItem value="contract">Vertrag</MenuItem>
                <MenuItem value="report">Bericht</MenuItem>
                <MenuItem value="form">Formular</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveWorkflow}
              disabled={isLoading || !workflow.name}
              fullWidth
            >
              Speichern
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
        {/* Sidebar */}
        <Sidebar onDragStart={onDragStart} />

        {/* Flow Designer */}
        <Box sx={{ flexGrow: 1, height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap nodeStrokeWidth={3} />
            <Background gap={12} size={1} />
          </ReactFlow>
        </Box>

        {/* Properties Panel für ausgewählte Knoten */}
        {selectedNode && (
          <Box sx={{ width: 300, p: 2, borderLeft: 1, borderColor: 'divider', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Eigenschaften</Typography>
              <Tooltip title="Knoten löschen">
                <IconButton color="error" onClick={() => setOpenConfirmDialog(true)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <WorkflowProperties
              node={selectedNode}
              updateNodeData={updateNodeData}
            />
          </Box>
        )}
      </Box>

      {/* Snackbar für Fehler und Erfolg */}
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

      {/* Bestätigungsdialog für das Löschen eines Knotens */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Knoten löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie diesen Workflow-Schritt wirklich löschen? Alle verbundenen Kanten werden ebenfalls entfernt.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Abbrechen</Button>
          <Button
            onClick={() => {
              removeNode();
              setOpenConfirmDialog(false);
            }}
            color="error"
            autoFocus
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowDesigner;
