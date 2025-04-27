const jwt = require('jsonwebtoken');

// Authentifizierungs-Middleware
exports.protect = async (req, res, next) => {
  let token;

  // Token aus dem Header extrahieren
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Prüfen, ob ein Token vorhanden ist
  if (!token) {
    return res.status(401).json({ 
      message: 'Nicht autorisiert, bitte melden Sie sich an' 
    });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Benutzerinformationen an die Request anfügen
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ 
      message: 'Nicht autorisiert, ungültiger Token' 
    });
  }
};

// Rollenbasierte Zugriffskontrolle
exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Nicht autorisiert, bitte melden Sie sich an' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Rolle "${req.user.role}" hat keine Berechtigung für diese Aktion` 
      });
    }

    next();
  };
};
