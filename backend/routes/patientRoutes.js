const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getPatientProfile, updatePatientProfile, getPatientDashboard, getPatientMedicines, getAdherenceReport } = require('../controllers/patientController');

router.use(protect);
router.use(authorize('patient'));

router.get('/profile', getPatientProfile);
router.put('/profile', updatePatientProfile);
router.get('/dashboard', getPatientDashboard);
router.get('/medicines', getPatientMedicines);
router.get('/adherence', getAdherenceReport);

module.exports = router;
