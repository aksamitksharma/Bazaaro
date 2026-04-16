const Review = require('../models/Review');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { paginate } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.createReview = async (req, res) => {
  try {
    const { vendorId, orderId, productId, rating, comment } = req.body;
    const order = await Order.findOne({ _id: orderId, customerId: req.user._id, vendorId, orderStatus: 'delivered' });
    if (!order) return res.status(400).json({ success: false, message: 'You can only review after delivery' });

    const existing = await Review.findOne({ userId: req.user._id, orderId });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });

    const review = await Review.create({ userId: req.user._id, vendorId, orderId, productId, rating, comment });

    // Update vendor rating
    const reviews = await Review.find({ vendorId });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Vendor.findByIdAndUpdate(vendorId, { rating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length });

    if (productId) {
      const pReviews = await Review.find({ productId });
      const pAvg = pReviews.reduce((s, r) => s + r.rating, 0) / pReviews.length;
      await Product.findByIdAndUpdate(productId, { avgRating: Math.round(pAvg * 10) / 10, totalRatings: pReviews.length });
    }

    res.status(201).json({ success: true, review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getVendorReviews = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const total = await Review.countDocuments({ vendorId: req.params.vendorId, isVisible: true });
    const reviews = await Review.find({ vendorId: req.params.vendorId, isVisible: true })
      .populate('userId', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(limit);

    const distribution = await Review.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(req.params.vendorId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: -1 } }
    ]);

    res.json({ success: true, reviews, distribution, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.replyToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor || review.vendorId.toString() !== vendor._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    review.vendorReply = req.body.reply;
    review.vendorReplyDate = new Date();
    await review.save();
    res.json({ success: true, review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
