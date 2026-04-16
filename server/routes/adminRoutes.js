const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const admin = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', admin.getDashboard);
router.get('/users', admin.getUsers);
router.put('/users/:id/toggle', admin.toggleUser);
router.get('/vendors/pending', admin.getPendingVendors);
router.put('/vendors/:id/approve', admin.approveVendor);
router.get('/orders', admin.getAllOrders);
router.post('/orders/assign-delivery', admin.assignDelivery);
router.get('/coupons', admin.getCoupons);
router.post('/coupons', admin.createCoupon);
router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.get('/analytics', admin.getAnalytics);

module.exports = router;
