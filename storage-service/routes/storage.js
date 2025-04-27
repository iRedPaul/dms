const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const storageController = require('../controllers/storageController');

/**
 * @route   POST /upload
 * @desc    Datei hochladen
 * @access  Private
 */
router.post('/upload', protect, storageController.uploadFile);

/**
 * @route   GET /download/:filename
 * @desc    Datei herunterladen
 * @access  Private
 */
router.get('/download/:filename', protect, storageController.downloadFile);

/**
 * @route   GET /preview/:filename
 * @desc    Datei-Vorschau generieren
 * @access  Private
 */
router.get('/preview/:filename', protect, storageController.generatePreview);

/**
 * @route   DELETE /delete/:filename
 * @desc    Datei löschen
 * @access  Private (nur Admin)
 */
router.delete('/delete/:filename', protect, authorize('admin'), storageController.deleteFile);

module.exports = router;
