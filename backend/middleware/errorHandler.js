/**
 * Globaler Fehlerhandler für alle Anfragen
 * Formatiert Fehler für eine einheitliche API-Antwort
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('=== ERROR HANDLER CALLED ===');
  console.error(`Original URL: ${req.originalUrl}`);
  console.error(`HTTP Method: ${req.method}`);
  console.error(`Error name: ${err.name}`);
  console.error(`Error message: ${err.message}`);
  console.error('Stack trace:', err.stack);
  
  // Zusätzliche Informationen für spezifische Fehlertypen
  if (err.name === 'ValidationError') {
    console.error('Validation error details:', err.errors);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    console.error('JWT error details:', err);
  } else if (err.code === 11000) {
    console.error('MongoDB duplicate key error:', err.keyValue);
  }

  // Request-Details für Debugging
  console.error('Request headers:', req.headers);
  console.error('Request body:', req.body);
  
  // Fehlerstatus bestimmen (standardmäßig 500)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`Response status code: ${statusCode}`);
  
  // JSON-Antwort mit Fehlerdetails
  const responseBody = {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    errors: err.errors || undefined
  };
  
  console.error('Response payload:', responseBody);
  console.error('=== END ERROR HANDLER ===');
  
  res.status(statusCode).json(responseBody);
};

/**
 * Fehlerbehandlung für nicht gefundene Routen (404)
 */
exports.notFoundHandler = (req, res, next) => {
  console.error(`=== 404 NOT FOUND: ${req.originalUrl} ===`);
  console.error('Request headers:', req.headers);
  console.error('Request method:', req.method);
  
  const error = new Error(`Ressource nicht gefunden - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Behandlung von MongoDB-Validierungsfehlern
 * Konvertiert MongoDB-Fehlermeldungen in ein besser lesbares Format
 */
exports.mongooseErrorHandler = (err) => {
  console.error('=== MONGOOSE ERROR HANDLER ===');
  console.error('Original error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = {};
    
    // Validierungsfehler extrahieren
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
      console.error(`Validation error for field '${key}': ${err.errors[key].message}`);
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
    console.error(`Duplicate key error for field '${field}' with value '${value}'`);
    
    return {
      message: `Der ${field} '${value}' wird bereits verwendet`,
      errors: { [field]: `Der ${field} '${value}' wird bereits verwendet` }
    };
  }
  
  // Ursprünglichen Fehler zurückgeben, wenn nicht speziell behandelt
  console.error('Error not specifically handled, returning original error');
  return err;
};
