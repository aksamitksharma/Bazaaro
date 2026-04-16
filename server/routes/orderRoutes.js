const router = require('express').Router();
const { placeOrder, getOrders, getOrder, updateOrderStatus, cancelOrder, trackOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, placeOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('vendor', 'admin'), updateOrderStatus);
router.post('/:id/cancel', protect, cancelOrder);
router.get('/:id/track', protect, trackOrder);

module.exports = router;
