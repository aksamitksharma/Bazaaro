const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryPartner = require('../models/DeliveryPartner');
const Coupon = require('../models/Coupon');
const Category = require('../models/Category');
const { paginate } = require('../utils/helpers');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const thisMonth = new Date(today); thisMonth.setDate(1);

    const [totalUsers, totalVendors, totalOrders, totalProducts, totalDeliveryPartners,
      todayOrders, monthRevenue, pendingVendors] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments({ isApproved: true }),
      Order.countDocuments(),
      Product.countDocuments(),
      DeliveryPartner.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { orderStatus: 'delivered', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Vendor.countDocuments({ isApproved: false })
    ]);

    const recentOrders = await Order.find().populate('customerId','name').populate('vendorId','shopName')
      .sort({ createdAt: -1 }).limit(10);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    res.json({ success: true,
      totalUsers, totalVendors, totalOrders, totalProducts, totalDeliveryPartners,
      todayOrders, revenue: monthRevenue[0]?.total || 0, pendingVendors,
      recentOrders, ordersByStatus
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user, message: user.isActive ? 'User activated' : 'User deactivated' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getPendingVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ isApproved: false }).populate('userId', 'name phone email');
    res.json({ success: true, vendors });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.approveVendor = async (req, res) => {
  try {
    const decided = req.body.isApproved ?? req.body.approved;
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    vendor.isApproved = decided;
    await vendor.save();
    res.json({ success: true, vendor, message: decided ? 'Vendor approved' : 'Vendor rejected' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const { status } = req.query;
    let query = {};
    if (status) query.orderStatus = status;
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('customerId','name phone')
      .populate('vendorId','shopName').sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ success: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.assignDelivery = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const dp = await DeliveryPartner.findById(deliveryPartnerId);
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    order.deliveryPartnerId = dp._id;
    order.statusHistory.push({ status: 'assigned', timestamp: new Date(), note: 'Manually assigned by admin' });
    await order.save();
    dp.isAvailable = false; dp.currentOrderId = order._id; await dp.save();
    res.json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, categories });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { '_id': 1 } }
    ]);
    const topVendors = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $group: { _id: '$vendorId', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { revenue: -1 } }, { $limit: 10 },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: '$vendor' }
    ]);
    res.json({ success: true, analytics: { dailyOrders, topVendors } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
