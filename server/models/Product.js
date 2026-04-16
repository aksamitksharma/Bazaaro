const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, lowercase: true },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: { type: String, default: '' },
  images: [{ type: String }],
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  discount: { type: Number, default: 0 }, // percentage
  unit: { type: String, enum: ['kg', 'g', 'piece', 'litre', 'ml', 'pack', 'dozen', 'plate', 'bowl'], default: 'piece' },
  unitValue: { type: Number, default: 1 }, // e.g., 500 for 500g
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: true },
  tags: [{ type: String }],
  nutritionInfo: { type: String, default: '' },
  isVeg: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 0 }, // minutes
  totalSold: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 }
}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', tags: 'text', description: 'text' });
// Compound index for vendor products
productSchema.index({ vendorId: 1, isAvailable: 1 });

// Auto-generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  // Calculate discount
  if (this.mrp && this.price < this.mrp) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
