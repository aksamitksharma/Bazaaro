const User = require('../models/User');
const Vendor = require('../models/Vendor');
const DeliveryPartner = require('../models/DeliveryPartner');
const { generateToken, generateOTP } = require('../utils/helpers');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, address } = req.body;

    // Check if user exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    // Create user
    user = await User.create({
      name,
      phone,
      email: email || undefined,
      password: password || phone + '123', // default password for OTP-only users
      role: role || 'customer',
      address: address || {},
      isVerified: true // auto-verify in dev mode
    });

    // If vendor role, create vendor profile
    if (role === 'vendor') {
      await Vendor.create({
        userId: user._id,
        shopName: req.body.shopName || `${name}'s Shop`,
        shopCategory: req.body.shopCategory || 'general',
        address: address || {}
      });
    }

    // If delivery role, create delivery partner profile
    if (role === 'delivery') {
      await DeliveryPartner.create({
        userId: user._id,
        vehicleType: req.body.vehicleType || 'motorcycle'
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password || phone + '123');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await User.findOne({ phone });
    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    }

    // In dev: log OTP to console instead of sending SMS
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Include OTP in dev mode for easy testing
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
    }

    // Dev mode: accept "123456" as universal OTP
    if (process.env.NODE_ENV !== 'production' && otp === '123456') {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      const token = generateToken(user._id);
      return res.json({ success: true, token, user });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'OTP verified', token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let vendorProfile = null;
    let deliveryProfile = null;

    if (user.role === 'vendor') {
      vendorProfile = await Vendor.findOne({ userId: user._id });
    }
    if (user.role === 'delivery') {
      deliveryProfile = await DeliveryPartner.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user,
      vendorProfile,
      deliveryProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, address, avatar, language } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (address) {
      if (!user.address) user.address = {};
      user.address.street = address.street || user.address.street || '';
      user.address.city = address.city || user.address.city || '';
      user.address.state = address.state || user.address.state || '';
      user.address.pincode = address.pincode || user.address.pincode || '';
    }
    if (avatar) user.avatar = avatar;
    if (language) user.language = language;

    await user.save();

    // Cascade address update to Vendor profile if user is a vendor
    if (user.role === 'vendor' && address) {
      const vendor = await Vendor.findOne({ userId: user._id });
      if (vendor) {
        if (!vendor.address) vendor.address = {};
        vendor.address.street = address.street || vendor.address.street || '';
        vendor.address.city = address.city || vendor.address.city || '';
        vendor.address.state = address.state || vendor.address.state || '';
        vendor.address.pincode = address.pincode || vendor.address.pincode || '';
        
        if (name && !vendor.shopName) vendor.shopName = `${name}'s Shop`;
        await vendor.save();
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
