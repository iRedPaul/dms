// storage-service/middleware/errorHandler.js

/**
 * Globaler Fehlerhandler für alle Anfragen
 * Formatiert Fehler für eine einheitliche API-Antwort
 */
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Fehlerstatus bestimmen (standardmäßig 500)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // JSON-Antwort mit Fehlerdetails
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    errors: err.errors || undefined
  });
};

/**
 * Fehlerbehandlung für nicht gefundene Routen (404)
 */
exports.notFoundHandler = (req, res, next) => {
  const error = new Error(`Ressource nicht gefunden - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
