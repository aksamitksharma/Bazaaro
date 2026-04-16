const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  images: [{ type: String }],
  vendorReply: { type: String, default: '' },
  vendorReplyDate: { type: Date },
  isVerifiedPurchase: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

reviewSchema.index({ vendorId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
