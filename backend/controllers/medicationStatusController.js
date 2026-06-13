const MedicationStatus = require('../models/MedicationStatus');
const Patient = require('../models/Patient');
const Medicine = require('../models/Medicine');
const { logActivity } = require('../utils/activityLogger');

// @desc    Mark medication status (taken/missed/pending)
// @route   POST /api/medication-status
// @access  Private/Patient
const markStatus = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const { medicineId, date, scheduledTime, status, notes, dose } = req.body;

    // Verify medicine belongs to patient
    const medicine = await Medicine.findOne({ _id: medicineId, patient: patient._id });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found or not assigned to you' });

    const statusDate = new Date(date);
    statusDate.setHours(0, 0, 0, 0);

    // Upsert
    const existing = await MedicationStatus.findOne({
      patient: patient._id,
      medicine: medicineId,
      date: statusDate,
      ...(scheduledTime && { scheduledTime })
    });

    let medicationStatus;
    if (existing) {
      existing.status = status;
      existing.takenAt = status === 'taken' ? new Date() : null;
      existing.notes = notes;
      existing.dose = dose;
      await existing.save();
      medicationStatus = existing;
    } else {
      medicationStatus = await MedicationStatus.create({
        patient: patient._id,
        medicine: medicineId,
        date: statusDate,
        scheduledTime,
        status,
        takenAt: status === 'taken' ? new Date() : null,
        notes,
        dose
      });
    }

    await logActivity(req.user._id, 'MEDICATION_STATUS', `Medicine marked as ${status}`, 'medication_status', medicine._id);

    res.json({ success: true, message: `Medicine marked as ${status}`, medicationStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get medication status for a date range
// @route   GET /api/medication-status
// @access  Private/Patient
const getStatusHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const { startDate, endDate, medicineId } = req.query;

    const query = { patient: patient._id };
    if (medicineId) query.medicine = medicineId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const statuses = await MedicationStatus.find(query)
      .populate('medicine', 'name dosage frequency color')
      .sort({ date: -1, scheduledTime: 1 });

    res.json({ success: true, statuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's medication schedule
// @route   GET /api/medication-status/today
// @access  Private/Patient
const getTodaySchedule = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const medicines = await Medicine.find({ patient: patient._id, isActive: true });

    const statuses = await MedicationStatus.find({
      patient: patient._id,
      date: { $gte: today, $lt: tomorrow }
    }).populate('medicine', 'name dosage frequency color timing beforeFood');

    // Merge medicines with their today status
    const schedule = medicines.map(med => {
      const statusEntry = statuses.find(s => s.medicine?._id?.toString() === med._id.toString());
      return {
        medicine: med,
        status: statusEntry ? statusEntry.status : 'pending',
        takenAt: statusEntry?.takenAt,
        statusId: statusEntry?._id
      };
    });

    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { markStatus, getStatusHistory, getTodaySchedule };
