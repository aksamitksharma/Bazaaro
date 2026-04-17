const router = require('express').Router();
const { placeOrder, getOrders, getOrder, updateOrderStatus, cancelOrder, trackOrder, validateCoupon, getAvailableCoupons } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, placeOrder);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/coupons', protect, getAvailableCoupons);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('vendor', 'admin'), updateOrderStatus);
router.post('/:id/cancel', protect, cancelOrder);
router.get('/:id/track', protect, trackOrder);

module.exports = router;
