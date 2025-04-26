const { validationResult } = require('express-validator');
const Workflow = require('../models/Workflow');
const Document = require('../models/Document');
const User = require('../models/User');

// @desc    Workflow erstellen
// @route   POST /api/workflows
// @access  Private (nur Admin und Workflow-Designer)
exports.createWorkflow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Nur Admins und Workflow-Designer dürfen Workflows erstellen
    if (!['admin', 'workflow-designer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Erstellen von Workflows' });
    }

    const workflowData = {
      ...req.body,
      createdBy: req.user.id
    };

    const workflow = await Workflow.create(workflowData);
    
    res.status(201).json(workflow);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Ein Workflow mit diesem Namen existiert bereits' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Alle Workflows abrufen
// @route   GET /api/workflows
// @access  Private
exports.getWorkflows = async (req, res) => {
  try {
    const filters = {};
    
    // Filter nach Aktivitätsstatus, wenn angegeben
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    // Filter nach Dokumententyp, wenn angegeben
    if (req.query.documentType) {
      filters.documentType = req.query.documentType;
    }

    const workflows = await Workflow.find(filters)
      .select('name description documentType isActive createdAt steps')
      .populate('createdBy', 'name username');
    
    res.json(workflows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Workflow nach ID abrufen
// @route   GET /api/workflows/:id
// @access  Private
exports.getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'name username');
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }
    
    res.json(workflow);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Workflow aktualisieren
// @route   PUT /api/workflows/:id
// @access  Private (nur Admin und Workflow-Designer)
exports.updateWorkflow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Nur Admins und Workflow-Designer dürfen Workflows aktualisieren
    if (!['admin', 'workflow-designer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Aktualisieren von Workflows' });
    }

    let workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }

    // Version und Versionshistorie aktualisieren
    const newVersion = workflow.version + 1;
    const versionHistoryEntry = {
      version: workflow.version,
      steps: workflow.steps,
      connections: workflow.connections,
      modifiedBy: req.user.id,
      modifiedAt: new Date()
    };

    // Update-Objekt erstellen
    const updateData = {
      ...req.body,
      version: newVersion,
      $push: { versionHistory: versionHistoryEntry }
    };

    // Workflow aktualisieren
    workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json(workflow);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Workflow löschen
// @route   DELETE /api/workflows/:id
// @access  Private (nur Admin)
exports.deleteWorkflow = async (req, res) => {
  try {
    // Nur Admins dürfen Workflows löschen
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung zum Löschen von Workflows' });
    }

    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }

    // Prüfen, ob der Workflow in aktiven Dokumenten verwendet wird
    const activeDocuments = await Document.countDocuments({
      'currentWorkflow.workflow': req.params.id,
      'currentWorkflow.status': { $in: ['in_progress', 'not_started'] }
    });

    if (activeDocuments > 0) {
      return res.status(400).json({ 
        message: 'Workflow kann nicht gelöscht werden, da er in aktiven Dokumenten verwendet wird',
        activeDocumentsCount: activeDocuments
      });
    }

    await workflow.remove();
    
    res.json({ message: 'Workflow erfolgreich gelöscht' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Workflow an einem Dokument starten
// @route   POST /api/workflows/:id/start/:documentId
// @access  Private
exports.startWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow nicht gefunden' });
    }

    if (!workflow.isActive) {
      return res.status(400).json({ message: 'Dieser Workflow ist nicht aktiv' });
    }

    const document = await Document.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }

    // Prüfen, ob bereits ein Workflow läuft
    if (document.currentWorkflow && 
        document.currentWorkflow.status === 'in_progress') {
      return res.status(400).json({ 
        message: 'Das Dokument hat bereits einen aktiven Workflow'
      });
    }

    // Workflow dem Dokument zuweisen
    document.currentWorkflow = {
      workflow: workflow._id,
      status: 'in_progress',
      currentStep: 0,
      startedAt: new Date()
    };

    await document.save();
    
    res.json({ 
      message: 'Workflow erfolgreich gestartet',
      document
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow oder Dokument nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};