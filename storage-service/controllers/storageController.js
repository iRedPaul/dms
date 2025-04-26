const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

// Speicherpfad aus der Umgebungsvariable
const STORAGE_PATH = process.env.STORAGE_PATH || '/storage';

// @desc    Datei hochladen
// @route   POST /upload
// @access  Private
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Keine Datei hochgeladen' });
    }

    // Dateityp bestimmen
    const fileType = getDocumentType(req.file.mimetype);
    
    // Zielverzeichnis basierend auf Dateityp
    const targetDir = path.join(STORAGE_PATH, fileType);
    
    // Eindeutigen Dateinamen generieren
    const uniqueFilename = `${Date.now()}_${uuidv4()}${path.extname(req.file.originalname)}`;
    const targetPath = path.join(targetDir, uniqueFilename);
    
    // Datei vom temporären Upload-Verzeichnis in das Zielverzeichnis verschieben
    await fs.move(req.file.path, targetPath);
    
    res.status(201).json({
      message: 'Datei erfolgreich hochgeladen',
      filename: uniqueFilename,
      path: path.relative(STORAGE_PATH, targetPath),
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('Fehler beim Hochladen der Datei:', err);
    res.status(500).json({ message: 'Fehler beim Hochladen der Datei' });
  }
};

// @desc    Datei herunterladen
// @route   GET /download/:filename
// @access  Private
exports.downloadFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Prüfen, ob ein Dateipfad angegeben wurde
    if (!filename) {
      return res.status(400).json({ message: 'Kein Dateiname angegeben' });
    }

    // Dateipfad im Speicherverzeichnis suchen
    let filePath = null;
    const directories = ['invoices', 'contracts', 'reports', 'forms', 'other'];
    
    for (const dir of directories) {
      const testPath = path.join(STORAGE_PATH, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    // Wenn Datei nicht gefunden wurde
    if (!filePath) {
      return res.status(404).json({ message: 'Datei nicht gefunden' });
    }
    
    // MIME-Typ bestimmen
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    // Datei senden
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    
    // Stream erstellen und Datei senden
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Fehler beim Herunterladen der Datei:', err);
    res.status(500).json({ message: 'Fehler beim Herunterladen der Datei' });
  }
};

// @desc    Datei-Vorschau generieren
// @route   GET /preview/:filename
// @access  Private
exports.generatePreview = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Prüfen, ob ein Dateipfad angegeben wurde
    if (!filename) {
      return res.status(400).json({ message: 'Kein Dateiname angegeben' });
    }

    // Dateipfad im Speicherverzeichnis suchen
    let filePath = null;
    const directories = ['invoices', 'contracts', 'reports', 'forms', 'other'];
    
    for (const dir of directories) {
      const testPath = path.join(STORAGE_PATH, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    // Wenn Datei nicht gefunden wurde
    if (!filePath) {
      return res.status(404).json({ message: 'Datei nicht gefunden' });
    }
    
    // MIME-Typ bestimmen
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    // Bei Bilddateien direkt als Vorschau senden
    if (mimeType.startsWith('image/')) {
      res.setHeader('Content-Type', mimeType);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }
    
    // Bei PDF-Dateien direkt als Vorschau senden
    if (mimeType === 'application/pdf') {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }
    
    // Für andere Dateitypen nur Metadaten zurückgeben
    const stats = await fs.stat(filePath);
    
    res.json({
      filename,
      size: stats.size,
      mimetype: mimeType,
      message: 'Kein Vorschaumodus verfügbar für diesen Dateityp'
    });
  } catch (err) {
    console.error('Fehler beim Generieren der Vorschau:', err);
    res.status(500).json({ message: 'Fehler beim Generieren der Vorschau' });
  }
};

// @desc    Datei löschen
// @route   DELETE /delete/:filename
// @access  Private (nur Admin)
exports.deleteFile = async (req, res) => {
  try {
    // Nur Admins dürfen Dateien physisch löschen
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung zum Löschen von Dateien' });
    }

    const filename = req.params.filename;
    
    // Prüfen, ob ein Dateipfad angegeben wurde
    if (!filename) {
      return res.status(400).json({ message: 'Kein Dateiname angegeben' });
    }

    // Dateipfad im Speicherverzeichnis suchen
    let filePath = null;
    const directories = ['invoices', 'contracts', 'reports', 'forms', 'other'];
    
    for (const dir of directories) {
      const testPath = path.join(STORAGE_PATH, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    // Wenn Datei nicht gefunden wurde
    if (!filePath) {
      return res.status(404).json({ message: 'Datei nicht gefunden' });
    }
    
    // Datei löschen
    await fs.remove(filePath);
    
    res.json({ message: 'Datei erfolgreich gelöscht' });
  } catch (err) {
    console.error('Fehler beim Löschen der Datei:', err);
    res.status(500).json({ message: 'Fehler beim Löschen der Datei' });
  }
};

// Hilfsfunktion zum Bestimmen des Dokumenttyps anhand des MIME-Types
function getDocumentType(mimeType) {
  if (mimeType.includes('pdf')) {
    return 'other'; // PDF könnte zu verschiedenen Dokumenttypen gehören
  } else if (mimeType.includes('image')) {
    return 'other';
  } else if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessing')) {
    return 'contracts';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'reports';
  } else if (mimeType.includes('text')) {
    return 'other';
  } else {
    return 'other';
  }
}