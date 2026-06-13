const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs for current user
// @route   GET /api/activity
// @access  Private
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, entityType } = req.query;

    const query = { user: req.user._id };
    if (entityType) query.entityType = entityType;

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      logs,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getActivityLogs };
