const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models
const User = require('./models/User');
const Document = require('./models/Document');
const Mailbox = require('./models/Mailbox');

// Middleware
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add proper UTF-8 encoding
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Create admin user if not exists
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: process.env.ADMIN_USER });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        username: process.env.ADMIN_USER,
        password: hashedPassword,
        isAdmin: true
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Create default mailbox if not exists
const createDefaultMailbox = async () => {
  try {
    const defaultMailboxExists = await Mailbox.findOne({ name: 'Standard' });
    
    if (!defaultMailboxExists) {
      const adminUser = await User.findOne({ isAdmin: true });
      
      if (adminUser) {
        const defaultMailbox = await Mailbox.create({
          name: 'Standard',
          description: 'Standardpostkorb für alle Dokumente',
          createdBy: adminUser._id
        });
        
        // Give all users access to default mailbox
        await User.updateMany({}, { $push: { mailboxAccess: defaultMailbox._id } });
        
        console.log('Default mailbox created');
      }
    }
  } catch (error) {
    console.error('Error creating default mailbox:', error);
  }
};

// API routes
app.use('/api/users', require('./routes/users'));
app.use('/api/mailboxes', require('./routes/mailboxes'));

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get current user
app.get('/api/auth/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('mailboxAccess', 'name description');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Upload document
app.post('/api/documents/upload', authMiddleware, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const file = req.files.file;
    const { mailboxId } = req.body;
    
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

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `uploads/${fileName}`;
    
    // Move file to uploads directory
    await file.mv(path.join(__dirname, filePath));
    
    // Save document info to database
    const newDocument = new Document({
      name: file.name,
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

// Get all documents (filtered by mailbox if specified)
app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    const { mailboxId } = req.query;
    let query = {};
    
    // Filter by mailbox if specified
    if (mailboxId) {
      query.mailbox = mailboxId;
      
      // Verify user has access to this mailbox
      if (!req.user.isAdmin) {
        const user = await User.findById(req.user.id);
        const hasAccess = user.mailboxAccess.some(id => id.toString() === mailboxId);
        
        if (!hasAccess) {
          return res.status(403).json({ msg: 'Not authorized to access this mailbox' });
        }
      }
    } else if (!req.user.isAdmin) {
      // For non-admins, only show documents from accessible mailboxes
      const user = await User.findById(req.user.id);
      query.mailbox = { $in: user.mailboxAccess };
    }
    
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'username')
      .populate('mailbox', 'name');
      
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a document by id
app.get('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'username')
      .populate('mailbox', 'name');
      
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    // Check if user has access to this document's mailbox
    if (!req.user.isAdmin && document.mailbox) {
      const user = await User.findById(req.user.id);
      const hasAccess = user.mailboxAccess.some(
        id => id.toString() === document.mailbox._id.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({ msg: 'Not authorized to access this document' });
      }
    }
    
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete document
app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    // Check if user has access to delete this document
    if (!req.user.isAdmin && document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this document' });
    }
    
    // Delete file from uploads directory
    const filePath = path.join(__dirname, document.path);
    const fs = require('fs');
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await document.remove();
    res.json({ msg: 'Document removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Initialize admin user and start server
app.listen(PORT, async () => {
  await createAdminUser();
  await createDefaultMailbox();
  console.log(`Server running on port ${PORT}`);
});
