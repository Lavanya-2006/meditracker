const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createMedicine, getDoctorMedicines, getMedicine, updateMedicine, deleteMedicine, getMedicinesForPatient } = require('../controllers/medicineController');

router.use(protect);

router.post('/', authorize('doctor'), createMedicine);
router.get('/', authorize('doctor'), getDoctorMedicines);
router.get('/patient/:patientId', authorize('doctor'), getMedicinesForPatient);
router.get('/:id', getMedicine);
router.put('/:id', authorize('doctor'), updateMedicine);
router.delete('/:id', authorize('doctor'), deleteMedicine);

module.exports = router;
