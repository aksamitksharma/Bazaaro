const router = require('express').Router();
const { getNearbyVendors, getVendor, updateVendorProfile, toggleShop, getDashboard, getAnalytics, getDemandPredictions, getPriceSuggestions } = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', getNearbyVendors);
router.get('/dashboard', protect, authorize('vendor'), getDashboard);
router.get('/analytics', protect, authorize('vendor'), getAnalytics);
router.get('/ai/demand', protect, authorize('vendor'), getDemandPredictions);
router.get('/ai/pricing', protect, authorize('vendor'), getPriceSuggestions);
router.put('/profile', protect, authorize('vendor'), updateVendorProfile);
router.put('/toggle', protect, authorize('vendor'), toggleShop);
router.get('/:id', getVendor);

module.exports = router;
