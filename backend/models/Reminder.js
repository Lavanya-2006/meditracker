const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  repeatType: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'custom'],
    default: 'none'
  },
  repeatDays: [{
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'missed', 'snoozed'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  snoozeMinutes: {
    type: Number,
    default: 10
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
