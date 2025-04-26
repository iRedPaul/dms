const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Erstellt den initial Admin-Benutzer, wenn noch kein Admin existiert
 * 
 * Verwendet die Umgebungsvariablen ADMIN_USER und ADMIN_PASSWORD.
 * Falls diese nicht gesetzt sind, werden Standardwerte verwendet.
 */
exports.createInitialAdmin = async () => {
  try {
    // Prüfen, ob bereits ein Admin-Benutzer existiert
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin-Benutzer existiert bereits');
      return;
    }
    
    // Admin-Anmeldedaten aus Umgebungsvariablen holen
    const adminUsername = process.env.ADMIN_USER || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    
    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Admin-Benutzer erstellen
    const adminUser = new User({
      username: adminUsername,
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      active: true
    });
    
    await adminUser.save();
    
    console.log(`Admin-Benutzer "${adminUsername}" wurde erfolgreich erstellt`);
  } catch (err) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', err.message);
    throw err;
  }
};