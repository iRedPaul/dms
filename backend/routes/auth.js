const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Benutzer authentifizieren und Token erstellen
 * @access  Public
 */
router.post(
  '/login',
  [
    check('username', 'Bitte geben Sie einen Benutzernamen ein').notEmpty(),
    check('password', 'Bitte geben Sie ein Passwort ein').notEmpty()
  ],
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Aktuellen authentifizierten Benutzer abrufen
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Passwort des authentifizierten Benutzers ändern
 * @access  Private
 */
router.put(
  '/change-password',
  [
    protect,
    check('currentPassword', 'Bitte geben Sie Ihr aktuelles Passwort ein').notEmpty(),
    check('newPassword', 'Das neue Passwort muss mindestens 6 Zeichen lang sein').isLength({ min: 6 })
  ],
  changePassword
);

module.exports = router;