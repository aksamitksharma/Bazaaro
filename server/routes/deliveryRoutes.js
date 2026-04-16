const router = require('express').Router();
const { toggleOnline, updateLocation, getAssignedOrders, acceptDelivery, updateDeliveryStatus, getDashboard } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.put('/toggle', protect, authorize('delivery'), toggleOnline);
router.put('/location', protect, authorize('delivery'), updateLocation);
router.get('/orders', protect, authorize('delivery'), getAssignedOrders);
router.get('/dashboard', protect, authorize('delivery'), getDashboard);
router.put('/orders/:id/accept', protect, authorize('delivery'), acceptDelivery);
router.put('/orders/:id/status', protect, authorize('delivery'), updateDeliveryStatus);

module.exports = router;
