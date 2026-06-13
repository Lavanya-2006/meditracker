const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { markStatus, getStatusHistory, getTodaySchedule } = require('../controllers/medicationStatusController');

router.use(protect);
router.use(authorize('patient'));

router.post('/', markStatus);
router.get('/', getStatusHistory);
router.get('/today', getTodaySchedule);

module.exports = router;
