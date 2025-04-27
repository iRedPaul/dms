const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB verbinden
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB verbunden');
  console.log('MONGO_URI:', process.env.MONGO_URI);
  
  // User-Schema laden
  const UserSchema = mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Benutzername ist erforderlich'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Bitte geben Sie eine gültige E-Mail-Adresse an']
    },
    password: {
      type: String,
      required: [true, 'Passwort ist erforderlich'],
      minlength: [6, 'Passwort muss mindestens 6 Zeichen lang sein'],
      select: false
    },
    name: {
      type: String,
      required: [true, 'Name ist erforderlich']
    },
    role: {
      type: String,
      enum: ['admin', 'workflow-designer', 'approver', 'user', 'readonly'],
      default: 'user'
    },
    department: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date
    },
    assignedInboxes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inbox'
    }]
  });

  // Passwort-Vergleichsmethode hinzufügen
  UserSchema.methods.matchPassword = async function(enteredPassword) {
    console.log('Vergleiche Passwort');
    console.log('Eingegebenes Passwort:', enteredPassword);
    console.log('Gespeichertes Passwort (Hash):', this.password);
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Passwörter stimmen überein:', isMatch);
    return isMatch;
  };

  // Passwort vor dem Speichern hashen
  UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Passwort gehasht:', this.password);
    next();
  });

  const User = mongoose.model('User', UserSchema);
  
  // Admin-Benutzer löschen, falls vorhanden
  try {
    console.log('Versuche Admin-Benutzer zu löschen...');
    const deleteResult = await User.deleteOne({ username: 'admin' });
    console.log('Löschergebnis:', deleteResult);
  } catch (err) {
    console.error('Fehler beim Löschen des Admin-Benutzers:', err);
  }
  
  // Neuen Admin-Benutzer erstellen
  try {
    console.log('Erstelle neuen Admin-Benutzer...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin', salt);
    console.log('Passwort-Hash für "admin":', hashedPassword);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword, // Wird durch pre-save hook nicht erneut gehasht
      name: 'Administrator',
      role: 'admin',
      department: 'IT',
      active: true,
      createdAt: new Date()
    });
    
    // Save hook deaktivieren und direkt speichern
    adminUser.password = hashedPassword;
    
    // In MongoDB speichern
    await User.collection.insertOne({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      department: 'IT',
      active: true,
      createdAt: new Date()
    });
    
    console.log('Admin-Benutzer erfolgreich erstellt!');
  } catch (err) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', err);
  }
  
  // Prüfen, ob der Admin-Benutzer existiert
  try {
    console.log('Prüfe, ob Admin-Benutzer existiert...');
    const adminUser = await User.findOne({ username: 'admin' }).select('+password');
    
    if (adminUser) {
      console.log('Admin-Benutzer gefunden:');
      console.log('Username:', adminUser.username);
      console.log('Email:', adminUser.email);
      console.log('Rolle:', adminUser.role);
      console.log('Aktiv:', adminUser.active);
      console.log('Passwort-Hash:', adminUser.password);
      
      // Passwort testen
      const testPassword = 'admin';
      const isMatch = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`Passwort "${testPassword}" ist korrekt:`, isMatch);
    } else {
      console.log('FEHLER: Admin-Benutzer wurde nicht gefunden!');
    }
  } catch (err) {
    console.error('Fehler beim Abfragen des Admin-Benutzers:', err);
  }
  
  // Verbindung trennen
  mongoose.disconnect();
  console.log('MongoDB-Verbindung getrennt');
})
.catch(err => {
  console.error('Fehler bei der Verbindung zur MongoDB:', err);
});
