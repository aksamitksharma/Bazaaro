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

    // Calculate delivery charge
    let deliveryCharge = 0;
    if (deliveryAddress?.coordinates && vendor.address?.coordinates?.coordinates) {
      const [vLng, vLat] = vendor.address.coordinates.coordinates;
      const dist = calculateDistance(deliveryAddress.coordinates.lat, deliveryAddress.coordinates.lng, vLat, vLng);
      deliveryCharge = calculateDeliveryCharge(dist);
    } else {
      deliveryCharge = 30; // default
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.validUntil > new Date() && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity);
        } else {
          discount = coupon.discountValue;
        }
        coupon.usedCount += 1;
        coupon.usedBy.push(req.user._id);
        await coupon.save();
      }
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
