const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentifizierungs-Middleware
exports.protect = async (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE CALLED ===');
  console.log('Path:', req.originalUrl);
  console.log('Method:', req.method);
  
  let token;

  // Token aus dem Header extrahieren
  console.log('Authorization header:', req.headers.authorization);
  
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log(`Token extracted (first 15 chars): ${token.substring(0, 15)}...`);
  } else {
    console.log('No Bearer token found in Authorization header');
  }

  // Prüfen, ob ein Token vorhanden ist
  if (!token) {
    console.log('No token provided, authentication failed');
    return res.status(401).json({ 
      message: 'Nicht autorisiert, bitte melden Sie sich an' 
    });
  }

  try {
    // Token verifizieren
    console.log('Verifying token...');
    console.log(`Using JWT_SECRET (first 5 chars): ${process.env.JWT_SECRET?.substring(0, 5) || 'NOT_SET'}...`);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);

    // Benutzer aus der Datenbank abrufen
    console.log(`Finding user with ID: ${decoded.id}`);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log(`User with ID ${decoded.id} not found in database`);
      return res.status(401).json({ 
        message: 'Benutzer wurde nicht gefunden' 
      });
    }
    console.log(`User found: ${user.username}`);

    // Prüfen, ob der Benutzer aktiv ist
    if (!user.active) {
      console.log(`User ${user.username} is inactive`);
      return res.status(401).json({ 
        message: 'Benutzeraccount ist deaktiviert' 
      });
    }
    console.log(`User ${user.username} is active`);

    // Benutzerinformationen an die Request anfügen
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    console.log('User info attached to request');
    console.log('=== AUTH MIDDLEWARE SUCCESS ===');

    next();
  } catch (err) {
    console.error('=== AUTH MIDDLEWARE ERROR ===');
    console.error('Error type:', err.name);
    console.error('Error message:', err.message);
    console.error('Stack trace:', err.stack);
    
    if (err.name === 'JsonWebTokenError') {
      console.log('Invalid token format or signature');
    } else if (err.name === 'TokenExpiredError') {
      console.log('Token has expired');
    }
    
    return res.status(401).json({ 
      message: 'Nicht autorisiert, ungültiger Token',
      error: err.message
    });
  }
};

// Rollenbasierte Zugriffskontrolle
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('=== ROLE AUTHORIZATION CHECK ===');
    console.log('Required roles:', roles);
    
    if (!req.user) {
      console.log('No user attached to request');
      return res.status(401).json({ 
        message: 'Nicht autorisiert, bitte melden Sie sich an' 
      });
    }
    
    console.log(`User role: ${req.user.role}`);
    const hasRole = roles.includes(req.user.role);
    console.log(`Role authorization result: ${hasRole ? 'Authorized' : 'Unauthorized'}`);

    if (!hasRole) {
      return res.status(403).json({ 
        message: `Rolle "${req.user.role}" hat keine Berechtigung für diese Aktion` 
      });
    }

    next();
  };
};
