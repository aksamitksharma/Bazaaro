const router = require('express').Router();
const { createReview, getVendorReviews, replyToReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/vendor/:vendorId', getVendorReviews);
router.put('/:id/reply', protect, authorize('vendor'), replyToReview);

module.exports = router;
