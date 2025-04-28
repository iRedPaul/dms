const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  mailboxAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
