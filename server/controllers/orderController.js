const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const DeliveryPartner = require('../models/DeliveryPartner');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const { calculateDeliveryCharge, calculateDistance, paginate } = require('../utils/helpers');

// @desc    Place order
// @route   POST /api/orders
exports.placeOrder = async (req, res) => {
  try {
    const { vendorId, items, deliveryAddress, paymentMethod, couponCode, customerNote } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    if (!vendor.isOpen) return res.status(400).json({ success: false, message: 'This shop is currently closed' });

    // Validate and collect product details
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `${product.name} has only ${product.stock} items in stock` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        image: product.images?.[0] || ''
      });

      // Reduce stock
      product.stock -= item.quantity;
      product.totalSold += item.quantity;
      if (product.stock <= 0) product.isAvailable = false;
      await product.save();
    }

    // Match frontend flat delivery fee logic (Free over ₹200) to avoid huge cross-country location distance charges
    let deliveryCharge = subtotal >= 200 ? 0 : 30;

    if (deliveryAddress?.coordinates && vendor.address?.coordinates?.coordinates) {
      const [vLng, vLat] = vendor.address.coordinates.coordinates;
      const dist = calculateDistance(deliveryAddress.coordinates.lat, deliveryAddress.coordinates.lng, vLat, vLng);
      
      // Warn but don't block in dev to allow testing across cities
      if (dist > (vendor.deliveryRadius || 10) && process.env.NODE_ENV !== 'development') {
        return res.status(400).json({ success: false, message: `Delivery address is outside vendor radius (${dist.toFixed(1)} km away)` });
      }
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }
      if (coupon.validUntil < new Date()) {
        return res.status(400).json({ success: false, message: 'Coupon has expired' });
      }
      if (subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
      }
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }
      if (coupon.vendorId && coupon.vendorId.toString() !== vendorId) {
        return res.status(400).json({ success: false, message: 'Coupon is not applicable for this vendor' });
      }
      
      const userUsageCount = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
      if (userUsageCount >= coupon.perUserLimit) {
        return res.status(400).json({ success: false, message: 'You have exceeded the usage limit for this coupon' });
      }

      if (coupon.discountType === 'percentage') {
        discount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity);
      } else {
        discount = coupon.discountValue;
      }
      
      coupon.usedCount += 1;
      coupon.usedBy.push(req.user._id);
      await coupon.save();
    }

    const tax = Math.round(subtotal * 0.05); // 5% tax
    const total = subtotal + deliveryCharge + tax - discount;

    const order = await Order.create({
      customerId: req.user._id,
      vendorId: vendor._id,
      items: orderItems,
      subtotal,
      deliveryCharge,
      discount,
      tax,
      total,
      couponCode,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      deliveryAddress,
      vendorAddress: { coordinates: { lat: vendor.address?.coordinates?.coordinates?.[1], lng: vendor.address?.coordinates?.coordinates?.[0] } },
      statusHistory: [{ status: 'placed', timestamp: new Date() }],
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000), // 45 mins
      customerNote
    });

    // Update vendor stats
    vendor.totalOrders += 1;
    await vendor.save();

    // Create notifications
    await Notification.create({
      userId: vendor.userId,
      title: '🛒 New Order!',
      message: `New order #${order.orderNumber} received. ${orderItems.length} items, ₹${total}`,
      type: 'order',
      data: { orderId: order._id }
    });

    // Emit socket event
    if (req.io) {
      req.io.to(`vendor_${vendor._id}`).emit('new_order', { orderId: order._id, orderNumber: order.orderNumber });
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get orders (role-based)
// @route   GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const { status } = req.query;

    let query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      query.vendorId = vendor?._id;
    } else if (req.user.role === 'delivery') {
      const dp = await DeliveryPartner.findOne({ userId: req.user._id });
      query.deliveryPartnerId = dp?._id;
    }

    if (status) query.orderStatus = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customerId', 'name phone avatar')
      .populate('vendorId', 'shopName address')
      .populate('deliveryPartnerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone avatar')
      .populate('vendorId', 'shopName address userId')
      .populate('deliveryPartnerId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = status;
    order.statusHistory.push({ status, timestamp: new Date(), note });

    // Automated Delivery Assignment Logic
    if (status === 'ready' && !order.deliveryPartnerId) {
      const vLat = order.vendorAddress?.coordinates?.lat;
      const vLng = order.orderAddress?.coordinates?.lng || order.vendorAddress?.coordinates?.lng;
      if (vLat !== undefined && vLng !== undefined) {
        const nearestPartner = await DeliveryPartner.findOne({
          isOnline: true,
          isAvailable: true,
          isVerified: true,
          currentLocation: {
            $near: {
              $geometry: { type: 'Point', coordinates: [vLng, vLat] },
              $maxDistance: 10000 // 10km radius
            }
          }
        });

        if (nearestPartner) {
          order.deliveryPartnerId = nearestPartner._id;
          order.statusHistory.push({ status: 'assigned', timestamp: new Date(), note: 'System auto-assigned to nearest rider' });
          
          nearestPartner.isAvailable = false;
          nearestPartner.currentOrderId = order._id;
          await nearestPartner.save();

          await Notification.create({
            userId: nearestPartner.userId,
            title: '🚚 New Delivery Assigned!',
            message: `You have been automatically assigned Order #${order.orderNumber}.`,
            type: 'delivery',
            data: { orderId: order._id }
          });

          if (req.io) {
            req.io.to(`delivery_${nearestPartner._id}`).emit('new_delivery', { orderId: order._id });
          }
        } else {
          order.statusHistory.push({ status: 'ready', timestamp: new Date(), note: 'No riders nearby, awaiting manual assignment' });
        }
      }
    }

    if (status === 'delivered') {
      order.actualDelivery = new Date();
      order.paymentStatus = 'paid';
      // Update vendor earnings
      const vendor = await Vendor.findById(order.vendorId);
      if (vendor) {
        vendor.totalEarnings += order.subtotal * (1 - vendor.commission / 100);
        await vendor.save();
      }
      // Update delivery partner
      if (order.deliveryPartnerId) {
        const dp = await DeliveryPartner.findById(order.deliveryPartnerId);
        if (dp) {
          dp.totalDeliveries += 1;
          dp.totalEarnings += order.deliveryCharge * 0.8;
          dp.isAvailable = true;
          dp.currentOrderId = null;
          await dp.save();
        }
      }
    }

    await order.save();

    // Notify customer
    await Notification.create({
      userId: order.customerId,
      title: `Order ${status.replace('_', ' ')}`,
      message: `Your order #${order.orderNumber} is now ${status.replace('_', ' ')}`,
      type: 'order',
      data: { orderId: order._id }
    });

    // Socket notification
    if (req.io) {
      req.io.to(`user_${order.customerId}`).emit('order_update', { orderId: order._id, status });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
        isAvailable: true
      });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: reason });

    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
      order.refundAmount = order.total;
    }

    await order.save();

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order tracking data
// @route   GET /api/orders/:id/track
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('vendorId', 'shopName address')
      .populate('deliveryPartnerId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    let deliveryLocation = null;
    if (order.deliveryPartnerId) {
      const dp = await DeliveryPartner.findById(order.deliveryPartnerId);
      if (dp) {
        deliveryLocation = dp.currentLocation;
      }
    }

    res.json({
      success: true,
      tracking: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        statusHistory: order.statusHistory,
        vendorLocation: order.vendorAddress,
        deliveryLocation: deliveryLocation?.coordinates ? {
          lat: deliveryLocation.coordinates[1],
          lng: deliveryLocation.coordinates[0]
        } : null,
        customerLocation: order.deliveryAddress?.coordinates,
        estimatedDelivery: order.estimatedDelivery
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate coupon
// @route   POST /api/orders/validate-coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, vendorId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }
    
    if (coupon.validUntil < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
    }

    if (coupon.vendorId && coupon.vendorId.toString() !== vendorId) {
      return res.status(400).json({ success: false, message: 'Coupon is not applicable for this vendor' });
    }

    // Per user limit check
    const userUsageCount = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: 'You have exceeded the usage limit for this coupon' });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({ success: true, discount, message: 'Coupon applied successfully', code: coupon.code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available coupons
// @route   GET /api/orders/coupons
exports.getAvailableCoupons = async (req, res) => {
  try {
    const { vendorId } = req.query;
    const query = {
      isActive: true,
      validUntil: { $gt: new Date() }
    };
    
    if (vendorId) {
      query.$or = [{ vendorId: null }, { vendorId }];
    } else {
      query.vendorId = null;
    }

    const coupons = await Coupon.find(query);
    
    const validCoupons = coupons.filter(c => {
      if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return false;
      const userUsageCount = c.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
      if (userUsageCount >= c.perUserLimit) return false;
      return true;
    });

    res.json({ 
      success: true, 
      coupons: validCoupons.map(c => ({
        _id: c._id, 
        code: c.code, 
        description: c.description,
        discountType: c.discountType, 
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount, 
        maxDiscount: c.maxDiscount
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
