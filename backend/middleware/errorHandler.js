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
  
  /**
   * Behandlung von MongoDB-Validierungsfehlern
   * Konvertiert MongoDB-Fehlermeldungen in ein besser lesbares Format
   */
  exports.mongooseErrorHandler = (err) => {
    if (err.name === 'ValidationError') {
      const errors = {};
      
      // Validierungsfehler extrahieren
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
      
      return {
        message: 'Validierungsfehler',
        errors
      };
    }
    
    // Duplikatsfehler (z.B. einzigartige Felder)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      
      return {
        message: `Der ${field} '${value}' wird bereits verwendet`,
        errors: { [field]: `Der ${field} '${value}' wird bereits verwendet` }
      };
    }
    
    // Ursprünglichen Fehler zurückgeben, wenn nicht speziell behandelt
    return err;
  };