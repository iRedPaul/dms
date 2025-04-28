const express = require('express');
const router = express.Router();
const Mailbox = require('../models/Mailbox');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Get all mailboxes (admins see all, regular users see only their accessible ones)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let mailboxes;
    
    if (req.user.isAdmin) {
      // Admins see all mailboxes
      mailboxes = await Mailbox.find().sort({ createdAt: -1 });
    } else {
      // Regular users see only mailboxes they have access to
      const user = await User.findById(req.user.id);
      mailboxes = await Mailbox.find({
        _id: { $in: user.mailboxAccess }
      }).sort({ createdAt: -1 });
    }
    
    res.json(mailboxes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create new mailbox (admin only)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const newMailbox = new Mailbox({
      name,
      description: description || '',
      createdBy: req.user.id
    });
    
    const mailbox = await newMailbox.save();
    res.json(mailbox);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get mailbox by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const mailbox = await Mailbox.findById(req.params.id);
    
    if (!mailbox) {
      return res.status(404).json({ msg: 'Mailbox not found' });
    }
    
    // Check if user has access to this mailbox
    if (!req.user.isAdmin) {
      const user = await User.findById(req.user.id);
      const hasAccess = user.mailboxAccess.some(id => id.toString() === mailbox._id.toString());
      
      if (!hasAccess) {
        return res.status(403).json({ msg: 'Not authorized to access this mailbox' });
      }
    }
    
    res.json(mailbox);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Mailbox not found' });
    }
    res.status(500).send('Server error');
  }
});

// Update mailbox (admin only)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const mailbox = await Mailbox.findById(req.params.id);
    
    if (!mailbox) {
      return res.status(404).json({ msg: 'Mailbox not found' });
    }
    
    mailbox.name = name || mailbox.name;
    mailbox.description = description !== undefined ? description : mailbox.description;
    
    await mailbox.save();
    res.json(mailbox);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Mailbox not found' });
    }
    res.status(500).send('Server error');
  }
});

// Delete mailbox (admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const mailbox = await Mailbox.findById(req.params.id);
    
    if (!mailbox) {
      return res.status(404).json({ msg: 'Mailbox not found' });
    }
    
    await mailbox.remove();
    
    // Remove this mailbox from all users' mailboxAccess
    await User.updateMany(
      { mailboxAccess: req.params.id },
      { $pull: { mailboxAccess: req.params.id } }
    );
    
    res.json({ msg: 'Mailbox removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Mailbox not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
