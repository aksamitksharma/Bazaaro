const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'scooter', 'car', 'walk'], default: 'motorcycle' },
  vehicleNumber: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  rating: { type: Number, default: 5 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  documents: [{
    type: { type: String }, // license, id_proof, etc.
    url: { type: String }
  }],
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Geospatial index
deliveryPartnerSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
