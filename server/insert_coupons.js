const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bazaaro';

async function seedCoupons() {
  try {
    await mongoose.connect(dbURI);
    
    // Create an expiry date 30 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const coupons = [
      {
        code: 'WELCOME50',
        description: 'Get 50% off on your first order up to ₹100',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: 100,
        minOrderAmount: 150,
        validUntil: validUntil,
        perUserLimit: 1,
        usageLimit: 0,
        isActive: true
      },
      {
        code: 'FESTIVE20',
        description: 'Get 20% off on all orders up to ₹50',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 50,
        minOrderAmount: 100,
        validUntil: validUntil,
        perUserLimit: 3,
        usageLimit: 0,
        isActive: true
      },
      {
        code: 'FLAT100',
        description: 'Flat ₹100 off on orders above ₹500',
        discountType: 'flat',
        discountValue: 100,
        maxDiscount: 0,
        minOrderAmount: 500,
        validUntil: validUntil,
        perUserLimit: 1,
        usageLimit: 500, // Top 500 users
        isActive: true
      }
    ];

    // Upsert coupons
    for (const data of coupons) {
      await Coupon.findOneAndUpdate({ code: data.code }, data, { upsert: true });
    }

    console.log('✅ Successfully created 3 realistic coupons for testing.');
  } catch (error) {
    console.error('⚠️ Error seeding coupons:', error);
  } finally {
    process.exit(0);
  }
}

seedCoupons();
