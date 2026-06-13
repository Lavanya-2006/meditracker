const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Medicine = require('../models/Medicine');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private/Doctor
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', '-password')
      .populate({
        path: 'patients',
        populate: { path: 'user', select: 'firstName lastName email phone profileImage username' }
      });

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private/Doctor
const updateDoctorProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage, specialization, licenseNumber, hospital, experience, bio, availableHours, address } = req.body;

    const userUpdate = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (phone) userUpdate.phone = phone;
    if (profileImage !== undefined) userUpdate.profileImage = profileImage;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true, runValidators: true });
    }

    const doctorUpdate = {};
    if (specialization) doctorUpdate.specialization = specialization;
    if (licenseNumber) doctorUpdate.licenseNumber = licenseNumber;
    if (hospital) doctorUpdate.hospital = hospital;
    if (experience !== undefined) doctorUpdate.experience = experience;
    if (bio) doctorUpdate.bio = bio;
    if (availableHours) doctorUpdate.availableHours = availableHours;
    if (address) doctorUpdate.address = address;

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      doctorUpdate,
      { new: true, runValidators: true }
    ).populate('user', '-password');

    await logActivity(req.user._id, 'PROFILE_UPDATE', 'Doctor profile updated', 'profile', doctor._id);

    res.json({ success: true, message: 'Profile updated successfully', doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all patients for a doctor
// @route   GET /api/doctors/patients
// @access  Private/Doctor
const getDoctorPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    let patientQuery = { _id: { $in: doctor.patients } };

    // Build aggregation for search
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let patients = await Patient.find(patientQuery)
      .populate('user', 'firstName lastName email phone profileImage username createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(p =>
        p.user.firstName.toLowerCase().includes(searchLower) ||
        p.user.lastName.toLowerCase().includes(searchLower) ||
        p.user.email.toLowerCase().includes(searchLower) ||
        p.user.username.toLowerCase().includes(searchLower)
      );
    }

    const total = doctor.patients.length;

    res.json({
      success: true,
      patients,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add existing patient to doctor
// @route   POST /api/doctors/patients/add
// @access  Private/Doctor
const addPatient = async (req, res) => {
  try {
    const { patientEmail } = req.body;

    const patientUser = await User.findOne({ email: patientEmail, role: 'patient' });
    if (!patientUser) {
      return res.status(404).json({ success: false, message: 'No registered patient found with that email' });
    }

    const patientProfile = await Patient.findOne({ user: patientUser._id });
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    if (patientProfile.doctor) {
      const existingDoctor = await Doctor.findById(patientProfile.doctor);
      if (existingDoctor && existingDoctor.user.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Patient is already in your list' });
      }
      return res.status(400).json({ success: false, message: 'Patient is already assigned to another doctor' });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });

    // Add patient to doctor's list
    if (!doctor.patients.includes(patientProfile._id)) {
      doctor.patients.push(patientProfile._id);
      await doctor.save();
    }

    // Assign doctor to patient
    patientProfile.doctor = doctor._id;
    await patientProfile.save();

    await logActivity(req.user._id, 'PATIENT_ADDED', `Patient ${patientUser.firstName} ${patientUser.lastName} added`, 'patient', patientProfile._id);

    const populatedPatient = await Patient.findById(patientProfile._id)
      .populate('user', 'firstName lastName email phone profileImage username');

    res.json({ success: true, message: 'Patient added successfully', patient: populatedPatient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove patient from doctor
// @route   DELETE /api/doctors/patients/:patientId
// @access  Private/Doctor
const removePatient = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const patient = await Patient.findById(req.params.patientId);

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    doctor.patients = doctor.patients.filter(p => p.toString() !== req.params.patientId);
    await doctor.save();

    patient.doctor = null;
    await patient.save();

    await logActivity(req.user._id, 'PATIENT_REMOVED', `Patient removed`, 'patient', patient._id);

    res.json({ success: true, message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get doctor dashboard stats
// @route   GET /api/doctors/dashboard
// @access  Private/Doctor
const getDoctorDashboard = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const totalPatients = doctor.patients.length;
    const totalMedicines = await Medicine.countDocuments({ doctor: doctor._id, isActive: true });
    const recentPatients = await Patient.find({ _id: { $in: doctor.patients } })
      .populate('user', 'firstName lastName email profileImage')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentMedicines = await Medicine.find({ doctor: doctor._id })
      .populate({ path: 'patient', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Medicines per patient
    const medicinesByPatient = await Medicine.aggregate([
      { $match: { doctor: doctor._id } },
      { $group: { _id: '$patient', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      dashboard: {
        totalPatients,
        totalMedicines,
        activePatientsWithMeds: medicinesByPatient.length,
        recentPatients,
        recentMedicines,
        medicinesByPatient
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDoctorProfile, updateDoctorProfile, getDoctorPatients, addPatient, removePatient, getDoctorDashboard };
