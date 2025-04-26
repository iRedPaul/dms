const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

// Routen importieren
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const documentsRoutes = require('./routes/documents');
const workflowsRoutes = require('./routes/workflows');
const inboxesRoutes = require('./routes/inboxes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API-Routen
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/inboxes', inboxesRoutes);

// Standardroute für Health Check
app.get('/', (req, res) => {
  res.json({ message: 'DMS API ist aktiv' });
});

// Globaler Fehlerhandler
app.use(errorHandler);

module.exports = app;