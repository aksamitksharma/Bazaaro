const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const { paginate, calculateDistance } = require('../utils/helpers');
const csv = require('csv-parser');
const fs = require('fs');
const aiEngine = require('../services/aiEngine');

// @desc    Get all products (with filters)
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, sort, vendor, isVeg } = req.query;
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);

    let query = { isAvailable: true };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (vendor) query.vendorId = vendor;
    if (isVeg !== undefined) query.isVeg = isVeg === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_low') sortObj = { price: 1 };
    if (sort === 'price_high') sortObj = { price: -1 };
    if (sort === 'rating') sortObj = { avgRating: -1 };
    if (sort === 'popular') sortObj = { totalSold: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('vendorId', 'shopName address rating isOpen')
      .populate('category', 'name icon')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get nearby products
// @route   GET /api/products/nearby
exports.getNearbyProducts = async (req, res) => {
  try {
    const { lat, lng, radius = 5, search, category } = req.query;
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location (lat, lng) is required' });
    }

    // Find nearby vendors
    const nearbyVendors = await Vendor.find({
      'address.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000 // km to meters
        }
      },
      isApproved: true,
      isOpen: true
    }).select('_id');

    const vendorIds = nearbyVendors.map(v => v._id);

    let query = { vendorId: { $in: vendorIds }, isAvailable: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('vendorId', 'shopName address rating isOpen')
      .populate('category', 'name icon')
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compare prices for a product
// @route   GET /api/products/compare/:productName
exports.compareProducts = async (req, res) => {
  try {
    const { productName } = req.params;
    const { lat, lng, radius = 10 } = req.query;

    let vendorFilter = {};
    if (lat && lng) {
      try {
        const nearbyVendors = await Vendor.find({
          'address.coordinates': {
            $near: {
              $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: parseFloat(radius) * 1000
            }
          },
          isApproved: true
        }).select('_id');
        vendorFilter = { vendorId: { $in: nearbyVendors.map(v => v._id) } };
      } catch (_) { /* geo index might not exist yet */ }
    }

    // Try $text search first, fallback to regex if text index not ready
    let products;
    try {
      products = await Product.find({
        $text: { $search: productName },
        isAvailable: true,
        ...vendorFilter
      })
      .populate('vendorId', 'shopName address rating totalReviews isOpen')
      .sort({ price: 1 })
      .limit(20);
    } catch (_) {
      products = await Product.find({
        name: { $regex: productName, $options: 'i' },
        isAvailable: true,
        ...vendorFilter
      })
      .populate('vendorId', 'shopName address rating totalReviews isOpen')
      .sort({ price: 1 })
      .limit(20);
    }

    // Add distance info + map to {vendor, product} structure
    const results = products.map((p, i) => {
      const product = p.toObject();
      const vendor = product.vendorId;
      product.vendorId = undefined;
      if (lat && lng && vendor?.address?.coordinates?.coordinates) {
        const [vLng, vLat] = vendor.address.coordinates.coordinates;
        vendor.distance = calculateDistance(parseFloat(lat), parseFloat(lng), vLat, vLng);
        vendor.distanceFormatted = vendor.distance < 1
          ? `${Math.round(vendor.distance * 1000)}m`
          : `${vendor.distance.toFixed(1)}km`;
      }
      return { vendor, product, isBestDeal: i === 0 };
    });

    res.json({
      success: true,
      query: productName,
      results,
      total: results.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendorId', 'shopName address rating isOpen operatingHours deliveryRadius')
      .populate('category', 'name icon');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: resolve category name → ObjectId
const resolveCategoryId = async (categoryInput) => {
  if (!categoryInput || categoryInput === '') return undefined;
  // Already a valid ObjectId?
  const mongoose = require('mongoose');
  if (mongoose.Types.ObjectId.isValid(categoryInput)) return categoryInput;
  // Treat as name — find or create
  let cat = await Category.findOne({ name: { $regex: new RegExp(`^${categoryInput}$`, 'i') } });
  if (!cat) {
    const slug = categoryInput.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    cat = await Category.create({ name: categoryInput, slug, icon: '📦' });
  }
  return cat._id;
};

// @desc    Create product (vendor)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const body = { ...req.body };
    body.vendorId = vendor._id;
    body.images = req.files ? req.files.map(f => `/uploads/products/${f.filename}`) : body.images || [];
    // Resolve category: empty string → undefined so Mongoose won't validate ObjectId
    body.category = body.category ? await resolveCategoryId(body.category) : undefined;
    // Ensure numeric fields
    if (body.price) body.price = parseFloat(body.price);
    if (body.mrp) body.mrp = parseFloat(body.mrp) || undefined;
    if (body.stock) body.stock = parseInt(body.stock) || 0;

    const product = await Product.create(body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product (vendor)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
    }

    const body = { ...req.body };
    body.category = body.category ? await resolveCategoryId(body.category) : product.category;
    if (body.price) body.price = parseFloat(body.price);
    if (body.mrp) body.mrp = parseFloat(body.mrp) || undefined;
    if (body.stock !== undefined) body.stock = parseInt(body.stock) || 0;

    product = await Product.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: false });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (vendor)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk upload products (CSV)
// @route   POST /api/products/bulk-upload
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }

    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const products = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          if (row.name && row.price) {
            products.push({
              vendorId: vendor._id,
              name: row.name,
              description: row.description || '',
              price: parseFloat(row.price),
              mrp: row.mrp ? parseFloat(row.mrp) : undefined,
              stock: parseInt(row.stock) || 0,
              unit: row.unit || 'piece',
              isVeg: row.isVeg !== 'false',
              tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
            });
          } else {
            errors.push({ row, error: 'Missing name or price' });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const inserted = await Product.insertMany(products, { ordered: false });
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `${inserted.length} products uploaded`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor's products
// @route   GET /api/products/vendor/my
exports.getMyProducts = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    const { skip, limit, page } = paginate(req.query.page, req.query.limit);
    const { lowStock } = req.query;

    let query = { vendorId: vendor._id };
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI Combo suggestions
// @route   POST /api/products/cheapest-combo
exports.getCheapestCombo = async (req, res) => {
  try {
    const { items, location } = req.body;
    if(!items || items.length === 0) return res.json({ success: true, combos: [] });
    const combos = await aiEngine.getCheapestCombo(items, location);
    res.json({ success: true, combos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
