const mongoose = require('mongoose');

const medicationStatusSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['taken', 'missed', 'pending', 'skipped'],
    default: 'pending'
  },
  takenAt: {
    type: Date
  },
  notes: {
    type: String
  },
  dose: {
    type: String
  }
}, { timestamps: true });

// Index for efficient queries
medicationStatusSchema.index({ patient: 1, date: 1 });
medicationStatusSchema.index({ medicine: 1, date: 1 });

module.exports = mongoose.model('MedicationStatus', medicationStatusSchema);
