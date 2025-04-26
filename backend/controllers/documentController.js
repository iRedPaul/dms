const axios = require('axios');
const { validationResult } = require('express-validator');
const Document = require('../models/Document');
const Inbox = require('../models/Inbox');
const User = require('../models/User');

// @desc    Dokument-Metadaten erstellen (ohne Datei)
// @route   POST /api/documents
// @access  Private
exports.createDocument = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const documentData = {
      ...req.body,
      uploadedBy: req.user.id
    };

    // Prüfen, ob Postkorb existiert, falls angegeben
    if (documentData.inbox) {
      const inbox = await Inbox.findById(documentData.inbox);
      if (!inbox) {
        return res.status(404).json({ message: 'Angegebener Postkorb existiert nicht' });
      }
      
      // Postkorb-Dokumentenzähler erhöhen
      await Inbox.findByIdAndUpdate(documentData.inbox, {
        $inc: { documentCount: 1 }
      });
    }

    const document = await Document.create(documentData);
    
    res.status(201).json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Dokument hochladen und erstellen
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    // Datei über den Storage-Service hochladen
    const fileData = new FormData();
    fileData.append('file', req.file);
    
    const storageResponse = await axios.post(
      `${process.env.STORAGE_SERVICE_URL}/upload`,
      fileData,
      {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (!storageResponse.data || !storageResponse.data.path) {
      return res.status(500).json({ message: 'Fehler beim Hochladen der Datei' });
    }

    // Dokument-Metadaten in der Datenbank speichern
    const documentData = {
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      filename: storageResponse.data.filename,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: storageResponse.data.path,
      documentType: req.body.documentType || 'other',
      uploadedBy: req.user.id,
      metadata: JSON.parse(req.body.metadata || '{}'),
      tags: req.body.tags ? req.body.tags.split(',') : []
    };

    // Postkorb zuweisen, falls angegeben
    if (req.body.inbox) {
      const inbox = await Inbox.findById(req.body.inbox);
      if (!inbox) {
        return res.status(404).json({ message: 'Angegebener Postkorb existiert nicht' });
      }
      
      documentData.inbox = req.body.inbox;
      
      // Postkorb-Dokumentenzähler erhöhen
      await Inbox.findByIdAndUpdate(req.body.inbox, {
        $inc: { documentCount: 1 }
      });
    }

    const document = await Document.create(documentData);
    
    res.status(201).json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Alle Dokumente abrufen (mit Filtern)
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    const { 
      documentType, status, search, 
      inbox, startDate, endDate, limit = 20, page = 1 
    } = req.query;
    
    const filter = {};
    
    // Filter nach Dokumententyp
    if (documentType) {
      filter.documentType = documentType;
    }
    
    // Filter nach Status
    if (status) {
      filter.status = status;
    }
    
    // Filter nach Postkorb
    if (inbox) {
      filter.inbox = inbox;
    }
    
    // Datumfilter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Suchfilter (Volltextsuche)
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Berechtigungsfilter (Nicht-Admins sehen nur Dokumente, auf die sie Zugriff haben)
    if (req.user.role !== 'admin') {
      filter.$or = [
        { uploadedBy: req.user.id },
        { 'accessControl.permissions.user': req.user.id },
        { 'accessControl.isPublic': true }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Dokumente abrufen
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name username')
      .populate('inbox', 'name type')
      .populate('currentWorkflow.workflow', 'name');
    
    // Gesamtanzahl für Pagination
    const total = await Document.countDocuments(filter);
    
    res.json({
      documents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Dokument nach ID abrufen
// @route   GET /api/documents/:id
// @access  Private
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name username')
      .populate('inbox', 'name type')
      .populate('currentWorkflow.workflow')
      .populate('accessControl.permissions.user', 'name username');
    
    if (!document) {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    
    // Zugriffsprüfung (Nicht-Admins brauchen explizite Berechtigung)
    if (req.user.role !== 'admin') {
      const hasAccess = 
        document.uploadedBy._id.toString() === req.user.id ||
        document.accessControl.isPublic ||
        document.accessControl.permissions.some(p => 
          p.user._id.toString() === req.user.id && p.canView
        );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Keine Berechtigung für dieses Dokument' });
      }
    }
    
    res.json(document);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Dokument aktualisieren
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    
    // Zugriffsprüfung (Nur Admin, Uploader oder Benutzer mit Bearbeitungsrechten)
    if (req.user.role !== 'admin' && 
        document.uploadedBy.toString() !== req.user.id && 
        !document.accessControl.permissions.some(p => 
          p.user.toString() === req.user.id && p.canEdit
        )) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Bearbeiten dieses Dokuments' });
    }

    // Dokument aktualisieren
    document = await Document.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name username')
      .populate('inbox', 'name type');
    
    res.json(document);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Dokument archivieren
// @route   PUT /api/documents/:id/archive
// @access  Private
exports.archiveDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    
    // Zugriffsprüfung
    if (req.user.role !== 'admin' && 
        document.uploadedBy.toString() !== req.user.id && 
        !document.accessControl.permissions.some(p => 
          p.user.toString() === req.user.id && p.canEdit
        )) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Archivieren dieses Dokuments' });
    }

    // Status auf "archived" setzen
    document.status = 'archived';
    await document.save();
    
    res.json({ message: 'Dokument erfolgreich archiviert', document });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Dokument löschen (als gelöscht markieren)
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    
    // Zugriffsprüfung (Nur Admin oder Uploader dürfen löschen)
    if (req.user.role !== 'admin' && 
        document.uploadedBy.toString() !== req.user.id && 
        !document.accessControl.permissions.some(p => 
          p.user.toString() === req.user.id && p.canDelete
        )) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Löschen dieses Dokuments' });
    }

    // Status auf "deleted" setzen (Soft Delete)
    document.status = 'deleted';
    await document.save();
    
    res.json({ message: 'Dokument erfolgreich gelöscht' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Dokument nicht gefunden' });
    }
    res.status(500).json({ message: 'Server-Fehler' });
  }
};