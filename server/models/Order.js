const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    unit: String,
    image: String
  }],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: { type: String },
  paymentMethod: { type: String, enum: ['cod', 'online', 'wallet'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  paymentId: { type: String },
  orderStatus: { 
    type: String, 
    enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked', 'on_the_way', 'delivered', 'cancelled'],
    default: 'placed'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  vendorAddress: {
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  cancelReason: { type: String },
  refundAmount: { type: Number, default: 0 },
  customerNote: { type: String },
  deliveryRating: { type: Number },
  vendorRating: { type: Number }
}, { timestamps: true });

// Auto-generate order number before validation
orderSchema.pre('validate', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = 'BZR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  }
  next();
});

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ vendorId: 1, orderStatus: 1 });
orderSchema.index({ deliveryPartnerId: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
