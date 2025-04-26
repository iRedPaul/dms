const mongoose = require('mongoose');

const InboxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Postkorb-Name ist erforderlich'],
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['department', 'user', 'workflow', 'system'],
    default: 'department'
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  documentCount: {
    type: Number,
    default: 0
  },
  notificationSettings: {
    emailNotification: {
      enabled: {
        type: Boolean,
        default: true
      },
      recipients: [String]
    },
    autoAssign: {
      enabled: {
        type: Boolean,
        default: false
      },
      assignmentStrategy: {
        type: String,
        enum: ['round_robin', 'workload_balanced', 'manual'],
        default: 'manual'
      }
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inbox', InboxSchema);