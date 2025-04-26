const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Authentifizierung und Token-Erstellung
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Benutzer suchen
    let user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
    }

    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
    }

    // Letztes Login aktualisieren
    user.lastLogin = new Date();
    await user.save();

    // JWT-Token erstellen
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

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

    res.json({
      token,
      user: userResponse
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Aktuellen Benutzer abrufen
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedInboxes', 'name type documentCount');
    
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};

// @desc    Passwort ändern
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Benutzer mit Passwort abrufen
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Aktuelles Passwort überprüfen
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort setzen
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
};