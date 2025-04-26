const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs-extra');

// Konfiguration laden
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const STORAGE_PATH = process.env.STORAGE_PATH || '/storage';

// MongoDB-Verbindung herstellen
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB verbunden...');
  
  // Speicherverzeichnisse erstellen
  try {
    // Hauptverzeichnis
    await fs.ensureDir(STORAGE_PATH);
    
    // Unterverzeichnisse für verschiedene Dokumentarten
    await fs.ensureDir(`${STORAGE_PATH}/invoices`);
    await fs.ensureDir(`${STORAGE_PATH}/contracts`);
    await fs.ensureDir(`${STORAGE_PATH}/reports`);
    await fs.ensureDir(`${STORAGE_PATH}/forms`);
    await fs.ensureDir(`${STORAGE_PATH}/other`);
    await fs.ensureDir(`${STORAGE_PATH}/temp`);
    
    console.log('Speicherverzeichnisse erstellt...');
  } catch (err) {
    console.error('Fehler beim Erstellen der Speicherverzeichnisse:', err.message);
    process.exit(1);
  }
  
  // Server starten
  app.listen(PORT, () => {
    console.log(`Storage-Service läuft auf Port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB Verbindungsfehler:', err.message);
  process.exit(1);
});