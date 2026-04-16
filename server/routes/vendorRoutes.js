const router = require('express').Router();
const { getNearbyVendors, getVendor, updateVendorProfile, toggleShop, getDashboard, getAnalytics } = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', getNearbyVendors);
router.get('/dashboard', protect, authorize('vendor'), getDashboard);
router.get('/analytics', protect, authorize('vendor'), getAnalytics);
router.put('/profile', protect, authorize('vendor'), updateVendorProfile);
router.put('/toggle', protect, authorize('vendor'), toggleShop);
router.get('/:id', getVendor);

module.exports = router;
