const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, description, entityType = null, entityId = null, metadata = null, ipAddress = null) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      description,
      entityType,
      entityId,
      metadata,
      ipAddress
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

module.exports = { logActivity };
