const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

/**
 * @route   POST /api/documents
 * @desc    Dokument-Metadaten erstellen (ohne Datei)
 * @access  Private
 */
router.post(
  '/',
  [
    protect,
    check('title', 'Dokumenttitel ist erforderlich').notEmpty()
  ],
  documentController.createDocument
);

/**
 * @route   POST /api/documents/upload
 * @desc    Dokument hochladen und erstellen
 * @access  Private
 */
router.post(
  '/upload',
  protect,
  documentController.uploadDocument
);

/**
 * @route   GET /api/documents
 * @desc    Alle Dokumente abrufen (mit Filtern)
 * @access  Private
 */
router.get('/', protect, documentController.getDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Dokument nach ID abrufen
 * @access  Private
 */
router.get('/:id', protect, documentController.getDocumentById);

/**
 * @route   PUT /api/documents/:id
 * @desc    Dokument aktualisieren
 * @access  Private
 */
router.put('/:id', protect, documentController.updateDocument);

/**
 * @route   PUT /api/documents/:id/archive
 * @desc    Dokument archivieren
 * @access  Private
 */
router.put('/:id/archive', protect, documentController.archiveDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Dokument löschen (als gelöscht markieren)
 * @access  Private
 */
router.delete('/:id', protect, documentController.deleteDocument);

module.exports = router;
