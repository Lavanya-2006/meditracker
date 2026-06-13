const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDoctorProfile, updateDoctorProfile, getDoctorPatients, addPatient, removePatient, getDoctorDashboard } = require('../controllers/doctorController');

router.use(protect);
router.use(authorize('doctor'));

router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);
router.get('/dashboard', getDoctorDashboard);
router.get('/patients', getDoctorPatients);
router.post('/patients/add', addPatient);
router.delete('/patients/:patientId', removePatient);

module.exports = router;
