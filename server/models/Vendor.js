const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName: { type: String, required: true, trim: true },
  shopDescription: { type: String, default: '' },
  shopImage: { type: String, default: '' },
  shopCategory: { type: String, default: 'general' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    }
  },
  isApproved: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: false },
  isSellFastMode: { type: Boolean, default: false }, // Game Changer feature
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  bankDetails: {
    accountNo: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  commission: { type: Number, default: 10 }, // percentage
  documents: [{
    type: { type: String },
    url: { type: String }
  }],
  operatingHours: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '21:00' }
  },
  deliveryRadius: { type: Number, default: 5 }, // km
  minOrderAmount: { type: Number, default: 0 }
}, { timestamps: true });

// Geospatial index for nearby queries
vendorSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('Vendor', vendorSchema);
