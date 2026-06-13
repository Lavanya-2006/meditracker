const Medicine = require('../models/Medicine');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { logActivity } = require('../utils/activityLogger');

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private/Doctor
const createMedicine = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const { patientId, name, genericName, dosage, frequency, timing, duration, startDate, beforeFood, notes, precautions, sideEffects, refillsRemaining, color } = req.body;

    // Verify patient belongs to this doctor
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (!doctor.patients.includes(patient._id.toString())) {
      return res.status(403).json({ success: false, message: 'Patient is not assigned to you' });
    }

    const medicine = await Medicine.create({
      doctor: doctor._id,
      patient: patient._id,
      name, genericName, dosage, frequency, timing, duration, startDate, beforeFood, notes, precautions, sideEffects, refillsRemaining, color
    });

    // Add medicine to patient's list
    if (!patient.medicines.includes(medicine._id)) {
      patient.medicines.push(medicine._id);
      await patient.save();
    }

    await logActivity(req.user._id, 'MEDICINE_CREATED', `Medicine "${name}" prescribed`, 'medicine', medicine._id, { patientId });

    res.status(201).json({ success: true, message: 'Medicine prescribed successfully', medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all medicines for doctor (all patients)
// @route   GET /api/medicines
// @access  Private/Doctor
const getDoctorMedicines = async (req, res) => {
  try {
    const { search, patientId, isActive, page = 1, limit = 10 } = req.query;
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const query = { doctor: doctor._id };
    if (patientId) query.patient = patientId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    let medicines = await Medicine.find(query)
      .populate({ path: 'patient', populate: { path: 'user', select: 'firstName lastName email' } })
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      medicines = medicines.filter(m =>
        m.name.toLowerCase().includes(s) ||
        (m.genericName && m.genericName.toLowerCase().includes(s))
      );
    }

    const total = medicines.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = medicines.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      medicines: paginated,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Private
const getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } });

    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    // Authorization check
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (medicine.doctor._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      if (medicine.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    res.json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private/Doctor
const updateMedicine = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (medicine.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this medicine' });
    }

    const { name, genericName, dosage, frequency, timing, duration, startDate, beforeFood, notes, precautions, sideEffects, refillsRemaining, isActive, color } = req.body;

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { name, genericName, dosage, frequency, timing, duration, startDate, beforeFood, notes, precautions, sideEffects, refillsRemaining, isActive, color },
      { new: true, runValidators: true }
    ).populate({ path: 'patient', populate: { path: 'user', select: 'firstName lastName email' } });

    await logActivity(req.user._id, 'MEDICINE_UPDATED', `Medicine "${medicine.name}" updated`, 'medicine', medicine._id);

    res.json({ success: true, message: 'Medicine updated successfully', medicine: updatedMedicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Doctor
const deleteMedicine = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (medicine.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this medicine' });
    }

    // Remove from patient's medicine list
    await Patient.findByIdAndUpdate(medicine.patient, {
      $pull: { medicines: medicine._id }
    });

    await medicine.deleteOne();
    await logActivity(req.user._id, 'MEDICINE_DELETED', `Medicine "${medicine.name}" deleted`, 'medicine', medicine._id);

    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get medicines for a specific patient (doctor view)
// @route   GET /api/medicines/patient/:patientId
// @access  Private/Doctor
const getMedicinesForPatient = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const medicines = await Medicine.find({ doctor: doctor._id, patient: req.params.patientId })
      .sort({ createdAt: -1 });

    res.json({ success: true, medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createMedicine, getDoctorMedicines, getMedicine, updateMedicine, deleteMedicine, getMedicinesForPatient };
