const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getActivityLogs } = require('../controllers/activityController');

router.use(protect);
router.get('/', getActivityLogs);

module.exports = router;
