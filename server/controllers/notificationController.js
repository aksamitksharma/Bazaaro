const Notification = require('../models/Notification');
const { paginate } = require('../utils/helpers');

exports.getNotifications = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const total = await Notification.countDocuments({ userId: req.user._id });
    const unread = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ success: true, notifications, unread, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
