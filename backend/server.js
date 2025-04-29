// Dieser Ausschnitt zeigt die notwendigen Änderungen an der server.js Datei,
// um große Datei-Uploads zu ermöglichen

// Erhöhte Limits für Datei-Uploads
app.use(express.json({
  charset: 'utf-8',
  type: ['application/json', 'text/plain'],
  limit: '100mb'  // Erhöht auf 100MB
}));

app.use(express.urlencoded({ 
  extended: true, 
  charset: 'utf-8',
  limit: '100mb'  // Erhöht auf 100MB
}));

app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    fields: 10,
    files: 1,
    parts: 20
  },
  abortOnLimit: true,
  useTempFiles: true,  // Verwendet temporäre Dateien für große Uploads
  tempFileDir: '/tmp/',
  responseOnLimit: 'Datei ist zu groß (max 100MB).',
  parseNested: true,
  debug: true
}));

// In der Nginx-Konfiguration müssen folgende Zeilen hinzugefügt werden:
// client_max_body_size 100M;
// proxy_read_timeout 600;
// proxy_connect_timeout 600;
// proxy_send_timeout 600;

// Neue Route für Datei-Upload mit unterstützung für 'chunking'
app.post('/api/documents/upload', authMiddleware, async (req, res) => {
  try {
    // Timeout erhöhen für größere Dateien
    req.setTimeout(300000); // 5 Minuten Timeout
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ msg: 'Keine Datei hochgeladen' });
    }

    const file = req.files.file;
    const { mailboxId, chunkUpload } = req.body;
    
    // Validate mailbox exists and user has access to it
    if (mailboxId) {
      const mailbox = await Mailbox.findById(mailboxId);
      if (!mailbox) {
        return res.status(404).json({ msg: 'Mailbox not found' });
      }
      
      if (!req.user.isAdmin) {
        const user = await User.findById(req.user.id);
        const hasAccess = user.mailboxAccess.some(id => id.toString() === mailboxId);
        
        if (!hasAccess) {
          return res.status(403).json({ msg: 'Not authorized to access this mailbox' });
        }
      }
    }

    // Sanitize filename to ensure UTF-8 compatibility
    const sanitizedName = Buffer.from(file.name, 'latin1').toString('utf8');
    const fileName = `${Date.now()}_${sanitizedName}`;
    const filePath = `uploads/${fileName}`;
    
    // Move file to uploads directory
    await file.mv(path.join(__dirname, filePath));
    
    // Save document info to database
    const newDocument = new Document({
      name: sanitizedName,
      path: filePath,
      type: file.mimetype,
      size: file.size,
      mailbox: mailboxId || null,
      uploadedBy: req.user.id
    });

    await newDocument.save();
    
    // Populate mailbox info for response
    const document = await Document.findById(newDocument._id)
      .populate('mailbox', 'name')
      .populate('uploadedBy', 'username');
      
    res.json(document);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
