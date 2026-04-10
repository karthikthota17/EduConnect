const Notification = require('../models/Notification');

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
                                          .sort('-createdAt')
                                          .limit(20);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all read
// @route   PUT /api/notifications/read
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id }, { read: true });
    res.status(200).json({ success: true, message: 'All marked read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
