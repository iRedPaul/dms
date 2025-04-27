const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const workflowController = require('../controllers/workflowController');

/**
 * @route   POST /api/workflows
 * @desc    Workflow erstellen
 * @access  Private (nur Admin und Workflow-Designer)
 */
router.post(
  '/',
  [
    protect,
    authorize(['admin', 'workflow-designer']),
    check('name', 'Workflow-Name ist erforderlich').notEmpty()
  ],
  workflowController.createWorkflow
);

/**
 * @route   GET /api/workflows
 * @desc    Alle Workflows abrufen
 * @access  Private
 */
router.get('/', protect, workflowController.getWorkflows);

/**
 * @route   GET /api/workflows/:id
 * @desc    Workflow nach ID abrufen
 * @access  Private
 */
router.get('/:id', protect, workflowController.getWorkflowById);

/**
 * @route   PUT /api/workflows/:id
 * @desc    Workflow aktualisieren
 * @access  Private (nur Admin und Workflow-Designer)
 */
router.put(
  '/:id',
  [
    protect,
    authorize(['admin', 'workflow-designer']),
    check('name', 'Workflow-Name ist erforderlich').notEmpty()
  ],
  workflowController.updateWorkflow
);

/**
 * @route   DELETE /api/workflows/:id
 * @desc    Workflow löschen
 * @access  Private (nur Admin)
 */
router.delete(
  '/:id',
  [protect, authorize('admin')],
  workflowController.deleteWorkflow
);

/**
 * @route   POST /api/workflows/:id/start/:documentId
 * @desc    Workflow an einem Dokument starten
 * @access  Private
 */
router.post(
  '/:id/start/:documentId',
  protect,
  workflowController.startWorkflow
);

module.exports = router;
