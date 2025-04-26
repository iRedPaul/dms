const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Dokumenttitel ist erforderlich'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  filename: {
    type: String,
    required: [true, 'Dateiname ist erforderlich']
  },
  originalFilename: {
    type: String,
    required: [true, 'Original-Dateiname ist erforderlich']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME-Typ ist erforderlich']
  },
  size: {
    type: Number,
    required: [true, 'Dateigröße ist erforderlich']
  },
  path: {
    type: String,
    required: [true, 'Dateipfad ist erforderlich']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ist erforderlich']
  },
  documentType: {
    type: String,
    enum: ['invoice', 'contract', 'report', 'form', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'deleted'],
    default: 'active'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String
  }],
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    path: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: Date
  }],
  currentWorkflow: {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow'
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'canceled'],
      default: 'not_started'
    },
    currentStep: {
      type: Number,
      default: 0
    },
    startedAt: Date,
    completedAt: Date
  },
  inbox: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inbox'
  },
  accessControl: {
    permissions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      canView: {
        type: Boolean,
        default: true
      },
      canEdit: {
        type: Boolean,
        default: false
      },
      canDelete: {
        type: Boolean,
        default: false
      }
    }],
    isPublic: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexe für bessere Suchleistung
DocumentSchema.index({ title: 'text', description: 'text', 'metadata.keywords': 'text' });
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ 'currentWorkflow.status': 1 });
DocumentSchema.index({ uploadedBy: 1 });
DocumentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Document', DocumentSchema);