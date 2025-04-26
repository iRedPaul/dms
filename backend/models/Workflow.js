const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Schrittname ist erforderlich']
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: [
      'upload',         // Dokumentenupload
      'form',           // Formular ausfüllen
      'approval',       // Genehmigung
      'notification',   // Benachrichtigung
      'condition',      // Bedingung/Verzweigung
      'archive',        // Archivierung
      'script'          // Skriptausführung
    ],
    required: [true, 'Schritttyp ist erforderlich']
  },
  assignedTo: {
    type: {
      type: String,
      enum: ['user', 'role', 'dynamic'],
      default: 'role'
    },
    value: {
      type: String
    }
  },
  formConfig: {
    fields: [{
      name: String,
      label: String,
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'file']
      },
      required: Boolean,
      options: [String],  // Für Auswahllisten
      defaultValue: mongoose.Schema.Types.Mixed
    }]
  },
  conditions: [{
    field: String,         // Feld, auf dem die Bedingung basiert
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains']
    },
    value: mongoose.Schema.Types.Mixed,
    nextStep: Number       // Index des nächsten Schritts, wenn Bedingung erfüllt
  }],
  timeout: {
    duration: Number,      // Timeout in Stunden
    action: {
      type: String,
      enum: ['notify', 'escalate', 'auto_approve', 'auto_reject']
    },
    notifyUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  position: {
    x: Number,             // X-Position im Workflow-Designer
    y: Number              // Y-Position im Workflow-Designer
  }
}, {
  _id: false
});

const WorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow-Name ist erforderlich'],
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  documentType: {
    type: String,
    enum: ['invoice', 'contract', 'report', 'form', 'any'],
    default: 'any'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  steps: [StepSchema],
  connections: [{
    source: {
      stepIndex: Number,
      connector: String
    },
    target: {
      stepIndex: Number,
      connector: String
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: Number,
    default: 1
  },
  versionHistory: [{
    version: Number,
    steps: [StepSchema],
    connections: [{
      source: {
        stepIndex: Number,
        connector: String
      },
      target: {
        stepIndex: Number,
        connector: String
      }
    }],
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Workflow', WorkflowSchema);