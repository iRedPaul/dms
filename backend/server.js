const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

// Models
const User = require('./models/User');
const Document = require('./models/Document');
const Mailbox = require('./models/Mailbox');

// Middleware
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS-Einstellungen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Body-Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('dev'));

// File Upload
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 },
}));

// Uploads-Verzeichnis erstellen
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads-Verzeichnis erstellt:', uploadsDir);
  } catch (err) {
    console.error('Fehler beim Erstellen des Uploads-Verzeichnisses:', err);
  }
}

// Statische Dateien
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routen

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'DMS service is running', 
    timestamp: new Date().toISOString(),
    charset: 'UTF-8',
    version: '1.0.2'
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login-Versuch für:', req.body.username);
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    });
  } catch (err) {
    console.error('Login-Fehler:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Benutzer abrufen
app.get('/api/auth/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('mailboxAccess', 'name description');
    res.json(user);
  } catch (err) {
    console.error('Fehler beim Abrufen des Benutzers:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Dokumente abrufen (mit besserer Fehlerbehandlung)
app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    console.log('GET /api/documents - Benutzerdaten:', req.user);
    
    const { mailboxId } = req.query;
    console.log('GET /api/documents - Angeforderter Postkorb:', mailboxId);
    
    let query = {};
    
    // Filter by mailbox if specified
    if (mailboxId) {
      query.mailbox = mailboxId;
      
      // Benutzer-Zugriff prüfen
      if (!req.user.isAdmin) {
        console.log('Benutzer ist kein Admin, prüfe Zugriffsrechte');
        const user = await User.findById(req.user.id);
        console.log('Benutzer-Postkörbe:', user.mailboxAccess);
        
        const hasAccess = user.mailboxAccess.some(id => id.toString() === mailboxId);
        
        if (!hasAccess) {
          console.log('Zugriff verweigert auf Postkorb:', mailboxId);
          return res.status(403).json({ msg: 'Keine Berechtigung für diesen Postkorb' });
        }
      }
    } else {
      console.log('Kein spezifischer Postkorb angegeben');
      
      // Für normale Benutzer nur Dokumente aus zugänglichen Postkörben zeigen
      if (!req.user.isAdmin) {
        const user = await User.findById(req.user.id);
        if (!user) {
          console.log('Benutzer nicht gefunden');
          return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
        }
        
        // Prüfen, ob mailboxAccess existiert
        if (!user.mailboxAccess || user.mailboxAccess.length === 0) {
          console.log('Benutzer hat keine Postkorbzugriffe');
          return res.json([]); // Keine Dokumente, wenn keine Postkörbe zugewiesen
        }
        
        query.mailbox = { $in: user.mailboxAccess };
      }
    }
    
    console.log('Datenbank-Query:', JSON.stringify(query));
    
    try {
      const documents = await Document.find(query)
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'username')
        .populate('mailbox', 'name');
      
      console.log(`${documents.length} Dokumente gefunden`);
      res.json(documents);
    } catch (dbErr) {
      console.error('Datenbank-Fehler beim Abrufen der Dokumente:', dbErr);
      return res.status(500).json({ msg: 'Datenbankfehler', error: dbErr.message });
    }
  } catch (err) {
    console.error('Allgemeiner Fehler bei /api/documents:', err);
    res.status(500).json({ msg: 'Server error', error: err.message, stack: err.stack });
  }
});

// Postkörbe abrufen
app.get('/api/mailboxes', authMiddleware, async (req, res) => {
  try {
    console.log('GET /api/mailboxes - Benutzer:', req.user.username);
    
    let mailboxes;
    
    if (req.user.isAdmin) {
      // Admins sehen alle Postkörbe
      mailboxes = await Mailbox.find().sort({ createdAt: -1 });
    } else {
      // Normale Benutzer sehen nur ihre zugänglichen Postkörbe
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
      }
      
      if (!user.mailboxAccess || user.mailboxAccess.length === 0) {
        return res.json([]); // Keine Postkörbe, wenn keine zugewiesen
      }
      
      mailboxes = await Mailbox.find({
        _id: { $in: user.mailboxAccess }
      }).sort({ createdAt: -1 });
    }
    
    console.log(`${mailboxes.length} Postkörbe gefunden`);
    res.json(mailboxes);
  } catch (err) {
    console.error('Fehler beim Abrufen der Postkörbe:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Admin-Benutzer erstellen, wenn keiner existiert
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: process.env.ADMIN_USER || 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin', 10);
      await User.create({
        username: process.env.ADMIN_USER || 'admin',
        password: hashedPassword,
        isAdmin: true
      });
      console.log('Admin-Benutzer erstellt');
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', error);
  }
};

// Standard-Postkorb erstellen, wenn keiner existiert
const createDefaultMailbox = async () => {
  try {
    const defaultMailboxExists = await Mailbox.findOne({ name: 'Standard' });
    
    if (!defaultMailboxExists) {
      const adminUser = await User.findOne({ isAdmin: true });
      
      if (adminUser) {
        const defaultMailbox = await Mailbox.create({
          name: 'Standard',
          description: 'Standardpostkorb für alle Dokumente',
          createdBy: adminUser._id
        });
        
        // Allen Benutzern Zugriff auf den Standard-Postkorb geben
        await User.updateMany({}, { $push: { mailboxAccess: defaultMailbox._id } });
        
        console.log('Standard-Postkorb erstellt');
      }
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des Standard-Postkorbs:', error);
  }
};

// MongoDB-Verbindung mit besserer Fehlerbehandlung
const connectDB = async () => {
  try {
    console.log('Verbinde mit MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI ? 'Vorhanden' : 'Fehlt!');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('MongoDB erfolgreich verbunden');
    return true;
  } catch (err) {
    console.error('MongoDB-Verbindungsfehler:', err);
    return false;
  }
};

// Server starten mit Fehlerbehandlung
const startServer = async () => {
  // Teste Uploads-Verzeichnis-Berechtigungen
  try {
    const testFile = path.join(uploadsDir, 'test.txt');
    fs.writeFileSync(testFile, 'Test');
    fs.unlinkSync(testFile);
    console.log('Uploads-Verzeichnis-Berechtigungen OK');
  } catch (err) {
    console.error('Fehler bei Uploads-Verzeichnis-Berechtigungen:', err);
  }
  
  // Verbinde zur Datenbank
  const dbConnected = await connectDB();
  
  if (dbConnected) {
    // Erstelle Admin und Standard-Postkorb
    await createAdminUser();
    await createDefaultMailbox();
  } else {
    console.log('HINWEIS: Server startet ohne Datenbankverbindung - einige Funktionen werden nicht verfügbar sein.');
  }
  
  // Server starten
  app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
  });
};

// Globaler Error-Handler
app.use((err, req, res, next) => {
  console.error('Globaler Fehler:', err);
  res.status(500).json({ 
    msg: 'Server error', 
    error: err.message,
    path: req.path
  });
});

// 404-Handler
app.all('/api/*', (req, res) => {
  console.log('404 - API-Endpunkt nicht gefunden:', req.path);
  res.status(404).json({ msg: 'API-Endpunkt nicht gefunden' });
});

// Starte den Server
startServer();
