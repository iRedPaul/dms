const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createInitialAdmin } = require('./utils/adminInitializer');

// Konfiguration laden
dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB-Verbindung herstellen
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB verbunden...');
  
  // Administrator-Benutzer beim ersten Start erstellen
  try {
    await createInitialAdmin();
  } catch (err) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', err.message);
  }
  
  // Server starten
  app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB Verbindungsfehler:', err.message);
  process.exit(1);
});