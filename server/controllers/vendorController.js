const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { calculateDistance, paginate } = require('../utils/helpers');
const aiEngine = require('../services/aiEngine');

// @desc    Get nearby vendors
// @route   GET /api/vendors/nearby
exports.getNearbyVendors = async (req, res) => {
  try {
    const { lat, lng, radius = 5, category, sort } = req.query;
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);

    if (!lat || !lng) {
      // Return all approved vendors if no location
      const vendors = await Vendor.find({ isApproved: true })
        .populate('userId', 'name phone avatar')
        .skip(skip).limit(limit);
      return res.json({ success: true, vendors, pagination: { page, limit, total: vendors.length } });
    }

    let query = {
      'address.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      },
      isApproved: true
    };

    if (category) query.shopCategory = category;

    const total = await Vendor.countDocuments({ isApproved: true });
    let vendors = await Vendor.find(query)
      .populate('userId', 'name phone avatar')
      .skip(skip)
      .limit(limit);

    // Add distance to each vendor
    vendors = vendors.map(v => {
      const vendor = v.toObject();
      if (v.address?.coordinates?.coordinates) {
        const [vLng, vLat] = v.address.coordinates.coordinates;
        vendor.distance = calculateDistance(parseFloat(lat), parseFloat(lng), vLat, vLng);
        vendor.distanceFormatted = vendor.distance < 1
          ? `${Math.round(vendor.distance * 1000)}m`
          : `${vendor.distance.toFixed(1)}km`;
      }
      return vendor;
    });

    if (sort === 'distance') vendors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    if (sort === 'rating') vendors.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    res.json({
      success: true,
      vendors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'name phone avatar');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get vendor's products
    const products = await Product.find({ vendorId: vendor._id, isAvailable: true })
      .populate('category', 'name icon')
      .sort({ totalSold: -1 });

    res.json({ success: true, vendor, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
exports.updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      vendor[key] = updates[key];
    });

    await vendor.save();
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle shop open/close
// @route   PUT /api/vendors/toggle
exports.toggleShop = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    vendor.isOpen = !vendor.isOpen;
    await vendor.save();

    res.json({ success: true, isOpen: vendor.isOpen, message: vendor.isOpen ? 'Shop is now open' : 'Shop is now closed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor dashboard data
// @route   GET /api/vendors/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setDate(1);

    // Stats
    const [todayOrders, weekOrders, monthOrders, totalProducts, lowStockProducts, pendingOrders] = await Promise.all([
      Order.countDocuments({ vendorId: vendor._id, createdAt: { $gte: today } }),
      Order.countDocuments({ vendorId: vendor._id, createdAt: { $gte: thisWeek } }),
      Order.countDocuments({ vendorId: vendor._id, createdAt: { $gte: thisMonth } }),
      Product.countDocuments({ vendorId: vendor._id }),
      Product.countDocuments({ vendorId: vendor._id, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Order.countDocuments({ vendorId: vendor._id, orderStatus: { $in: ['placed', 'confirmed'] } })
    ]);

    // Today's earnings
    const todayEarnings = await Order.aggregate([
      { $match: { vendorId: vendor._id, createdAt: { $gte: today }, orderStatus: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$subtotal' } } }
    ]);

    // Weekly earnings
    const weeklyEarnings = await Order.aggregate([
      { $match: { vendorId: vendor._id, createdAt: { $gte: thisWeek }, orderStatus: 'delivered' } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, total: { $sum: '$subtotal' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    // Top products
    const topProducts = await Product.find({ vendorId: vendor._id })
      .sort({ totalSold: -1 })
      .limit(5);

    // Recent orders
    const recentOrders = await Order.find({ vendorId: vendor._id })
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      vendor,
      totalProducts,
      lowStockProducts,
      pendingOrders,
      totalOrders: weekOrders,
      revenue: todayEarnings[0]?.total || 0,
      todayOrders,
      weekOrders,
      monthOrders,
      todayEarnings: todayEarnings[0]?.total || 0,
      totalEarnings: vendor.totalEarnings,
      weeklyEarnings,
      topProducts,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor analytics
// @route   GET /api/vendors/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Daily earnings chart
    const dailyEarnings = await Order.aggregate([
      { $match: { vendorId: vendor._id, orderStatus: 'delivered', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$subtotal' }, orders: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Order.aggregate([
      { $match: { vendorId: vendor._id, orderStatus: 'delivered' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $match: { vendorId: vendor._id } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      analytics: { dailyEarnings, categoryBreakdown, orderStatusBreakdown }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI Demand Predictions
// @route   GET /api/vendors/ai/demand
exports.getDemandPredictions = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if(!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const predictions = await aiEngine.getDemandPrediction(vendor._id);
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI Price Suggestions
// @route   GET /api/vendors/ai/pricing
exports.getPriceSuggestions = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if(!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const suggestions = await aiEngine.getPriceSuggestions(vendor._id);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
