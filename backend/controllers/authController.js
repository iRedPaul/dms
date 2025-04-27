const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Authentifizierung und Token-Erstellung
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Request body:', req.body);
  console.log('Headers:', JSON.stringify(req.headers));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);

  try {
    // Benutzer suchen
    console.log(`Finding user with username: ${username}`);
    let user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
    }
    
    console.log(`User found: ${user.username} (ID: ${user._id})`);
    console.log(`User role: ${user.role}, Active status: ${user.active}`);

    // Passwort überprüfen
    console.log('Checking password...');
    // Log hashed password (first 10 chars only for security)
    console.log(`Stored password hash (partial): ${user.password.substring(0, 10)}...`);
    
    const isMatch = await user.matchPassword(password);
    console.log(`Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
    }

    // Prüfen, ob Benutzer aktiv ist
    if (!user.active) {
      console.log(`User ${username} is inactive`);
      return res.status(401).json({ message: 'Benutzer ist deaktiviert' });
    }

    // Letztes Login aktualisieren
    user.lastLogin = new Date();
    await user.save();
    console.log(`Updated last login time for ${username}`);

    // JWT-Token erstellen
    const tokenPayload = { 
      id: user._id,
      username: user.username,
      role: user.role 
    };
    console.log('Creating JWT token with payload:', tokenPayload);
    console.log(`Using JWT_SECRET (first 5 chars): ${process.env.JWT_SECRET?.substring(0, 5) || 'NOT_SET'}...`);
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log(`JWT token generated (first 20 chars): ${token.substring(0, 20)}...`);

    // Benutzerinformationen ohne Passwort zurückgeben
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      assignedInboxes: user.assignedInboxes
    };
    console.log('User response prepared (without password)');

    console.log('=== LOGIN SUCCESS ===');
    res.json({
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error details:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Server-Fehler', error: err.message });
  }
};

// @desc    Aktuellen Benutzer abrufen
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  console.log('=== GET CURRENT USER REQUEST ===');
  console.log('User from token:', req.user);
  
  try {
    const user = await User.findById(req.user.id).populate('assignedInboxes', 'name type documentCount');
    
    if (!user) {
      console.log(`User not found with ID: ${req.user.id}`);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    
    console.log(`Found user: ${user.username} (${user.name})`);
    res.json(user);
  } catch (err) {
    console.error('Error in getMe:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Server-Fehler', error: err.message });
  }
};

// @desc    Passwort ändern
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  console.log('=== CHANGE PASSWORD REQUEST ===');
  console.log('User attempting password change:', req.user.username);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Benutzer mit Passwort abrufen
    console.log(`Finding user with ID: ${req.user.id}`);
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    console.log('User found');

    // Aktuelles Passwort überprüfen
    console.log('Checking current password...');
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      console.log('Current password does not match');
      return res.status(401).json({ message: 'Aktuelles Passwort ist falsch' });
    }
    console.log('Current password verified');

    // Neues Passwort setzen
    console.log('Setting new password...');
    user.password = newPassword;
    await user.save();
    console.log('Password updated successfully');

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (err) {
    console.error('Error in changePassword:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Server-Fehler', error: err.message });
  }
};
