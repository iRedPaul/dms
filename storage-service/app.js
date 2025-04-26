const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const storageRoutes = require('./routes/storage');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Größere Uploads erlauben
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/', storageRoutes);

// Health-Check-Route
app.get('/health', (req, res) => {
  res.json({ status: 'Storage-Service ist aktiv' });
});

// Globaler Fehlerhandler
app.use(errorHandler);

module.exports = app;