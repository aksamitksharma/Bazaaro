const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markAsRead, markAllRead } = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
