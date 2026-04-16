const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');
const { paginate } = require('../utils/helpers');

// @desc    Toggle online/offline
// @route   PUT /api/delivery/toggle
exports.toggleOnline = async (req, res) => {
  try {
    const dp = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

    dp.isOnline = !dp.isOnline;
    if (!dp.isOnline) dp.isAvailable = false;
    else dp.isAvailable = true;
    await dp.save();

    res.json({ success: true, isOnline: dp.isOnline, message: dp.isOnline ? 'You are now online' : 'You are now offline' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update location
// @route   PUT /api/delivery/location
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const dp = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

    dp.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    await dp.save();

    // If on active delivery, emit location update
    if (dp.currentOrderId && req.io) {
      const order = await Order.findById(dp.currentOrderId);
      if (order) {
        req.io.to(`order_${order._id}`).emit('location_update', { lat, lng });
        req.io.to(`user_${order.customerId}`).emit('location_update', { orderId: order._id, lat, lng });
      }
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assigned orders
// @route   GET /api/delivery/orders
exports.getAssignedOrders = async (req, res) => {
  try {
    const dp = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const { status } = req.query;

    let query = { deliveryPartnerId: dp._id };
    if (status) query.orderStatus = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customerId', 'name phone address')
      .populate('vendorId', 'shopName address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept delivery
// @route   PUT /api/delivery/orders/:id/accept
exports.acceptDelivery = async (req, res) => {
  try {
    const dp = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryPartnerId = dp._id;
    order.orderStatus = 'picked';
    order.statusHistory.push({ status: 'picked', timestamp: new Date(), note: 'Delivery partner assigned' });
    await order.save();

    dp.isAvailable = false;
    dp.currentOrderId = order._id;
    await dp.save();

    // Notify customer
    await Notification.create({
      userId: order.customerId,
      title: '🚚 Delivery Partner Assigned',
      message: `Your order #${order.orderNumber} has been picked up for delivery`,
      type: 'delivery',
      data: { orderId: order._id }
    });

    if (req.io) {
      req.io.to(`user_${order.customerId}`).emit('order_update', { orderId: order._id, status: 'picked' });
    }

    res.json({ success: true, message: 'Delivery accepted', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery status
// @route   PUT /api/delivery/orders/:id/status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const dp = await DeliveryPartner.findOne({ userId: req.user._id });
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = status;
    order.statusHistory.push({ status, timestamp: new Date() });

    if (status === 'delivered') {
      order.actualDelivery = new Date();
      order.paymentStatus = 'paid';
      dp.isAvailable = true;
      dp.currentOrderId = null;
      dp.totalDeliveries += 1;
      dp.totalEarnings += order.deliveryCharge * 0.8;
      await dp.save();

      // Update vendor earnings
      const vendor = await Vendor.findById(order.vendorId);
      if (vendor) {
        vendor.totalEarnings += order.subtotal * (1 - vendor.commission / 100);
        await vendor.save();
      }
    }

    await order.save();

    // Notify customer
    await Notification.create({
      userId: order.customerId,
      title: status === 'delivered' ? '✅ Order Delivered!' : `📦 Order Update`,
      message: `Order #${order.orderNumber} - ${status.replace('_', ' ')}`,
      type: 'delivery',
      data: { orderId: order._id }
    });

    if (req.io) {
      req.io.to(`user_${order.customerId}`).emit('order_update', { orderId: order._id, status });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get delivery dashboard
// @route   GET /api/delivery/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const dp = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeliveries, todayEarnings, activeOrder, pendingOrders] = await Promise.all([
      Order.countDocuments({ deliveryPartnerId: dp._id, orderStatus: 'delivered', actualDelivery: { $gte: today } }),
      Order.aggregate([
        { $match: { deliveryPartnerId: dp._id, orderStatus: 'delivered', actualDelivery: { $gte: today } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$deliveryCharge', 0.8] } } } }
      ]),
      Order.findOne({ deliveryPartnerId: dp._id, orderStatus: { $in: ['picked', 'on_the_way'] } })
        .populate('customerId', 'name phone address')
        .populate('vendorId', 'shopName address'),
      Order.find({ orderStatus: 'ready', deliveryPartnerId: { $exists: false } })
        .populate('vendorId', 'shopName address')
        .limit(10)
    ]);

    res.json({
      success: true,
      isOnline: dp.isOnline,
      isAvailable: dp.isAvailable,
      totalDeliveries: dp.totalDeliveries,
      earnings: dp.totalEarnings,
      todayDeliveries,
      todayEarnings: todayEarnings[0]?.total || 0,
      rating: dp.rating,
      activeOrder,
      pendingOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-assign nearest delivery partner
exports.autoAssignDelivery = async (order) => {
  try {
    const vendor = await Vendor.findById(order.vendorId);
    if (!vendor?.address?.coordinates?.coordinates) return null;

    const nearestPartner = await DeliveryPartner.findOne({
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: vendor.address.coordinates.coordinates
          },
          $maxDistance: 10000 // 10km
        }
      }
    });

    if (nearestPartner) {
      order.deliveryPartnerId = nearestPartner._id;
      await order.save();

      nearestPartner.isAvailable = false;
      nearestPartner.currentOrderId = order._id;
      await nearestPartner.save();

      return nearestPartner;
    }

    return null;
  } catch (error) {
    console.error('Auto-assign error:', error);
    return null;
  }
};
