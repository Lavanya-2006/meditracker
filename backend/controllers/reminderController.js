const Reminder = require('../models/Reminder');
const Patient = require('../models/Patient');
const { logActivity } = require('../utils/activityLogger');

// @desc    Create reminder
// @route   POST /api/reminders
// @access  Private/Patient
const createReminder = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const { medicineId, title, scheduledTime, repeatType, repeatDays, soundEnabled, snoozeMinutes, notes } = req.body;

    const reminder = await Reminder.create({
      patient: patient._id,
      medicine: medicineId,
      title,
      scheduledTime,
      repeatType,
      repeatDays,
      soundEnabled,
      snoozeMinutes,
      notes
    });

    const populated = await Reminder.findById(reminder._id).populate('medicine', 'name dosage color');

    await logActivity(req.user._id, 'REMINDER_CREATED', `Reminder "${title}" created`, 'reminder', reminder._id);

    res.status(201).json({ success: true, message: 'Reminder created successfully', reminder: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reminders for patient
// @route   GET /api/reminders
// @access  Private/Patient
const getReminders = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const { status, upcoming, page = 1, limit = 20 } = req.query;
    const query = { patient: patient._id, isActive: true };

    if (status) query.status = status;
    if (upcoming === 'true') {
      query.scheduledTime = { $gte: new Date() };
      query.status = 'pending';
    }

    const total = await Reminder.countDocuments(query);
    const reminders = await Reminder.find(query)
      .populate('medicine', 'name dosage color frequency')
      .sort({ scheduledTime: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      reminders,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private/Patient
const updateReminder = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    if (reminder.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, scheduledTime, repeatType, repeatDays, soundEnabled, snoozeMinutes, notes, status, isActive } = req.body;

    const updated = await Reminder.findByIdAndUpdate(
      req.params.id,
      { title, scheduledTime, repeatType, repeatDays, soundEnabled, snoozeMinutes, notes, status, isActive },
      { new: true, runValidators: true }
    ).populate('medicine', 'name dosage color');

    await logActivity(req.user._id, 'REMINDER_UPDATED', `Reminder updated`, 'reminder', reminder._id);

    res.json({ success: true, message: 'Reminder updated successfully', reminder: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private/Patient
const deleteReminder = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    if (reminder.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await reminder.deleteOne();
    await logActivity(req.user._id, 'REMINDER_DELETED', `Reminder deleted`, 'reminder', reminder._id);

    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark reminder as completed/snoozed
// @route   PATCH /api/reminders/:id/status
// @access  Private/Patient
const updateReminderStatus = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    if (reminder.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    reminder.status = status;
    if (status === 'completed') reminder.completedAt = new Date();
    await reminder.save();

    res.json({ success: true, message: 'Reminder status updated', reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReminder, getReminders, updateReminder, deleteReminder, updateReminderStatus };
