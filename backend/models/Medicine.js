const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  dosage: {
    amount: {
      type: String,
      required: [true, 'Dosage amount is required']
    },
    unit: {
      type: String,
      enum: ['mg', 'ml', 'g', 'mcg', 'IU', 'tablet', 'capsule', 'drops', 'puff', 'patch'],
      default: 'mg'
    }
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: [
      'once_daily',
      'twice_daily',
      'three_times_daily',
      'four_times_daily',
      'every_6_hours',
      'every_8_hours',
      'every_12_hours',
      'weekly',
      'biweekly',
      'monthly',
      'as_needed'
    ]
  },
  timing: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'bedtime']
  }],
  duration: {
    value: {
      type: Number,
      required: [true, 'Duration value is required']
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'ongoing'],
      default: 'days'
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  beforeFood: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  precautions: {
    type: String
  },
  sideEffects: {
    type: String
  },
  refillsRemaining: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#4F6EF7'
  }
}, { timestamps: true });

// Auto-calculate endDate
medicineSchema.pre('save', function(next) {
  if (this.startDate && this.duration && this.duration.unit !== 'ongoing') {
    const start = new Date(this.startDate);
    const { value, unit } = this.duration;
    if (unit === 'days') start.setDate(start.getDate() + value);
    else if (unit === 'weeks') start.setDate(start.getDate() + value * 7);
    else if (unit === 'months') start.setMonth(start.getMonth() + value);
    this.endDate = start;
  }
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);
