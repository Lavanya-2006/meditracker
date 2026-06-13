const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createReminder, getReminders, updateReminder, deleteReminder, updateReminderStatus } = require('../controllers/reminderController');

router.use(protect);
router.use(authorize('patient'));

router.post('/', createReminder);
router.get('/', getReminders);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);
router.patch('/:id/status', updateReminderStatus);

module.exports = router;
