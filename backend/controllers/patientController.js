const User = require('../models/User');
const Patient = require('../models/Patient');
const Medicine = require('../models/Medicine');
const MedicationStatus = require('../models/MedicationStatus');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private/Patient
const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
      .populate('user', '-password')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phone profileImage' }
      });

    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/profile
// @access  Private/Patient
const updatePatientProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage, dateOfBirth, gender, bloodGroup, weight, height, allergies, chronicConditions, emergencyContact, address, insuranceInfo } = req.body;

    const userUpdate = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (phone) userUpdate.phone = phone;
    if (profileImage !== undefined) userUpdate.profileImage = profileImage;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true, runValidators: true });
    }

    const patientUpdate = {};
    if (dateOfBirth) patientUpdate.dateOfBirth = dateOfBirth;
    if (gender) patientUpdate.gender = gender;
    if (bloodGroup !== undefined) patientUpdate.bloodGroup = bloodGroup;
    if (weight !== undefined) patientUpdate.weight = weight;
    if (height !== undefined) patientUpdate.height = height;
    if (allergies) patientUpdate.allergies = allergies;
    if (chronicConditions) patientUpdate.chronicConditions = chronicConditions;
    if (emergencyContact) patientUpdate.emergencyContact = emergencyContact;
    if (address) patientUpdate.address = address;
    if (insuranceInfo) patientUpdate.insuranceInfo = insuranceInfo;

    const patient = await Patient.findOneAndUpdate(
      { user: req.user._id },
      patientUpdate,
      { new: true, runValidators: true }
    ).populate('user', '-password').populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } });

    await logActivity(req.user._id, 'PROFILE_UPDATE', 'Patient profile updated', 'profile', patient._id);

    res.json({ success: true, message: 'Profile updated successfully', patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get patient dashboard
// @route   GET /api/patients/dashboard
// @access  Private/Patient
const getPatientDashboard = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const medicines = await Medicine.find({ patient: patient._id, isActive: true });

    const todayStatuses = await MedicationStatus.find({
      patient: patient._id,
      date: { $gte: today, $lt: tomorrow }
    }).populate('medicine', 'name dosage frequency color');

    const takenToday = todayStatuses.filter(s => s.status === 'taken').length;
    const missedToday = todayStatuses.filter(s => s.status === 'missed').length;
    const pendingToday = todayStatuses.filter(s => s.status === 'pending').length;

    // Adherence last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekStatuses = await MedicationStatus.find({
      patient: patient._id,
      date: { $gte: sevenDaysAgo }
    });

    const totalDoses = weekStatuses.length;
    const takenDoses = weekStatuses.filter(s => s.status === 'taken').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    res.json({
      success: true,
      dashboard: {
        totalMedicines: medicines.length,
        todayStats: { taken: takenToday, missed: missedToday, pending: pendingToday, total: medicines.length },
        adherenceRate,
        weeklyAdherence: { taken: takenDoses, missed: totalDoses - takenDoses, total: totalDoses },
        recentMedicines: medicines.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get patient medicines
// @route   GET /api/patients/medicines
// @access  Private/Patient
const getPatientMedicines = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, isActive } = req.query;
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const query = { patient: patient._id };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    let medicines = await Medicine.find(query)
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

// @desc    Get medication history / adherence
// @route   GET /api/patients/adherence
// @access  Private/Patient
const getAdherenceReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const statuses = await MedicationStatus.find({
      patient: patient._id,
      date: { $gte: startDate }
    }).populate('medicine', 'name color');

    // Group by date
    const byDate = {};
    statuses.forEach(s => {
      const dateKey = s.date.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = { taken: 0, missed: 0, pending: 0, total: 0 };
      byDate[dateKey][s.status]++;
      byDate[dateKey].total++;
    });

    // Group by medicine
    const byMedicine = {};
    statuses.forEach(s => {
      const medId = s.medicine?._id?.toString();
      if (!medId) return;
      if (!byMedicine[medId]) {
        byMedicine[medId] = { name: s.medicine.name, color: s.medicine.color, taken: 0, missed: 0, pending: 0, total: 0 };
      }
      byMedicine[medId][s.status]++;
      byMedicine[medId].total++;
    });

    const total = statuses.length;
    const taken = statuses.filter(s => s.status === 'taken').length;

    res.json({
      success: true,
      report: {
        overall: { total, taken, missed: total - taken, adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0 },
        byDate,
        byMedicine: Object.values(byMedicine)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPatientProfile, updatePatientProfile, getPatientDashboard, getPatientMedicines, getAdherenceReport };
