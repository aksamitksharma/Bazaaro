const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../../.env' });

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Category = require('../models/Category');
const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');

const connectDB = require('../config/db');

const categories = [
  { name: 'Groceries', slug: 'groceries', icon: '🛒', sortOrder: 1, subcategories: [
    { name: 'Fruits', slug: 'fruits' }, { name: 'Vegetables', slug: 'vegetables' },
    { name: 'Dairy', slug: 'dairy' }, { name: 'Grains', slug: 'grains' }
  ]},
  { name: 'Street Food', slug: 'street-food', icon: '🍔', sortOrder: 2, subcategories: [
    { name: 'Snacks', slug: 'snacks' }, { name: 'Chaat', slug: 'chaat' },
    { name: 'South Indian', slug: 'south-indian' }, { name: 'Chinese', slug: 'chinese' }
  ]},
  { name: 'Bakery', slug: 'bakery', icon: '🍞', sortOrder: 3, subcategories: [
    { name: 'Bread', slug: 'bread' }, { name: 'Cakes', slug: 'cakes' }, { name: 'Cookies', slug: 'cookies' }
  ]},
  { name: 'Beverages', slug: 'beverages', icon: '🥤', sortOrder: 4, subcategories: [
    { name: 'Tea & Coffee', slug: 'tea-coffee' }, { name: 'Juices', slug: 'juices' }, { name: 'Cold Drinks', slug: 'cold-drinks' }
  ]},
  { name: 'Household', slug: 'household', icon: '🏠', sortOrder: 5, subcategories: [
    { name: 'Cleaning', slug: 'cleaning' }, { name: 'Kitchen', slug: 'kitchen' }
  ]},
  { name: 'Personal Care', slug: 'personal-care', icon: '💄', sortOrder: 6, subcategories: [
    { name: 'Skincare', slug: 'skincare' }, { name: 'Hair Care', slug: 'hair-care' }
  ]},
  { name: 'Stationery', slug: 'stationery', icon: '📝', sortOrder: 7, subcategories: [
    { name: 'Notebooks', slug: 'notebooks' }, { name: 'Pens', slug: 'pens' }
  ]},
  { name: 'Electronics', slug: 'electronics', icon: '📱', sortOrder: 8, subcategories: [
    { name: 'Accessories', slug: 'accessories' }, { name: 'Chargers', slug: 'chargers' }
  ]}
];

// Delhi NCR coordinates for realistic data
const locations = [
  { lat: 28.6139, lng: 77.2090, area: 'Connaught Place' },
  { lat: 28.5355, lng: 77.3910, area: 'Noida Sector 62' },
  { lat: 28.4595, lng: 77.0266, area: 'Gurgaon Cyber Hub' },
  { lat: 28.6280, lng: 77.2197, area: 'Karol Bagh' },
  { lat: 28.6692, lng: 77.4538, area: 'Ghaziabad' },
  { lat: 28.5672, lng: 77.2100, area: 'Saket' },
  { lat: 28.6448, lng: 77.2167, area: 'Paharganj' },
  { lat: 28.7041, lng: 77.1025, area: 'Rohini' }
];

const seed = async () => {
  try {
    await connectDB();
    console.log('🧹 Clearing all data...');
    await Promise.all([
      User.deleteMany(), Vendor.deleteMany(), Product.deleteMany(),
      Category.deleteMany(), DeliveryPartner.deleteMany(), Order.deleteMany()
    ]);

    // Create categories
    console.log('📂 Creating categories...');
    const cats = await Category.insertMany(categories);
    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c._id);

    // Create admin
    console.log('👑 Creating admin...');
    const admin = await User.create({
      name: 'Super Admin', phone: '9999999999', email: 'admin@bazaaro.com',
      password: 'admin123', role: 'admin', isVerified: true
    });

    // Create customers
    console.log('👥 Creating customers...');
    const customers = [];
    const customerNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh'];
    for (let i = 0; i < 5; i++) {
      const loc = locations[i];
      customers.push(await User.create({
        name: customerNames[i], phone: `98000000${10 + i}`,
        password: 'user123', role: 'customer', isVerified: true,
        address: { street: loc.area, city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { lat: loc.lat, lng: loc.lng } }
      }));
    }

    // Create vendors
    console.log('🏪 Creating vendors...');
    const vendorData = [
      { name: 'Ramesh Kirana', shop: 'Ramesh General Store', cat: 'general', phone: '98100000' },
      { name: 'Suresh Chaiwala', shop: 'Suresh Tea & Snacks', cat: 'food', phone: '98100001' },
      { name: 'Meena Fruits', shop: 'Fresh Fruit Corner', cat: 'general', phone: '98100002' },
      { name: 'Pappu Bakery', shop: 'Pappu Fresh Bakery', cat: 'food', phone: '98100003' },
      { name: 'Sharma Electronics', shop: 'Quick Fix Electronics', cat: 'general', phone: '98100004' }
    ];

    const vendors = [];
    for (let i = 0; i < vendorData.length; i++) {
      const loc = locations[i];
      const user = await User.create({
        name: vendorData[i].name, phone: vendorData[i].phone + '01',
        password: 'vendor123', role: 'vendor', isVerified: true,
        address: { street: loc.area, city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { lat: loc.lat, lng: loc.lng } }
      });
      const vendor = await Vendor.create({
        userId: user._id, shopName: vendorData[i].shop, shopCategory: vendorData[i].cat,
        isApproved: true, isOpen: true, rating: 3.5 + Math.random() * 1.5,
        address: { street: loc.area, city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { type: 'Point', coordinates: [loc.lng, loc.lat] } },
        deliveryRadius: 5, minOrderAmount: 50
      });
      vendors.push(vendor);
    }

    // Create products for each vendor
    console.log('📦 Creating products...');
    const productTemplates = [
      // Groceries
      { name: 'Basmati Rice', cat: 'groceries', price: 85, mrp: 100, unit: 'kg', stock: 50, isVeg: true, tags: ['rice','grain'] },
      { name: 'Toor Dal', cat: 'groceries', price: 120, mrp: 140, unit: 'kg', stock: 30, isVeg: true, tags: ['dal','lentils'] },
      { name: 'Aashirvaad Atta', cat: 'groceries', price: 280, mrp: 320, unit: 'pack', stock: 20, isVeg: true, tags: ['flour','atta'] },
      { name: 'Amul Milk', cat: 'groceries', price: 28, mrp: 30, unit: 'litre', stock: 100, isVeg: true, tags: ['milk','dairy'] },
      { name: 'Fresh Tomatoes', cat: 'groceries', price: 30, mrp: 40, unit: 'kg', stock: 40, isVeg: true, tags: ['vegetable','tomato'] },
      { name: 'Onions', cat: 'groceries', price: 25, mrp: 35, unit: 'kg', stock: 60, isVeg: true, tags: ['vegetable','onion'] },
      { name: 'Potatoes', cat: 'groceries', price: 20, mrp: 30, unit: 'kg', stock: 80, isVeg: true, tags: ['vegetable','potato'] },
      { name: 'Amul Butter', cat: 'groceries', price: 55, mrp: 58, unit: 'piece', stock: 25, isVeg: true, tags: ['butter','dairy'] },
      // Street Food
      { name: 'Samosa', cat: 'street-food', price: 15, mrp: 15, unit: 'piece', stock: 200, isVeg: true, tags: ['snack','samosa'] },
      { name: 'Pani Puri', cat: 'street-food', price: 30, mrp: 30, unit: 'plate', stock: 100, isVeg: true, tags: ['chaat','panipuri'] },
      { name: 'Vada Pav', cat: 'street-food', price: 20, mrp: 20, unit: 'piece', stock: 150, isVeg: true, tags: ['snack','vadapav'] },
      { name: 'Chole Bhature', cat: 'street-food', price: 60, mrp: 70, unit: 'plate', stock: 50, isVeg: true, tags: ['meal','chole'] },
      // Bakery
      { name: 'White Bread', cat: 'bakery', price: 35, mrp: 40, unit: 'pack', stock: 30, isVeg: true, tags: ['bread'] },
      { name: 'Chocolate Cake', cat: 'bakery', price: 350, mrp: 400, unit: 'piece', stock: 10, isVeg: true, tags: ['cake','chocolate'] },
      // Beverages
      { name: 'Chai', cat: 'beverages', price: 10, mrp: 10, unit: 'piece', stock: 500, isVeg: true, tags: ['tea','chai'] },
      { name: 'Fresh Orange Juice', cat: 'beverages', price: 40, mrp: 50, unit: 'piece', stock: 30, isVeg: true, tags: ['juice','orange'] }
    ];

    for (const vendor of vendors) {
      // Each vendor gets 8-12 random products with slight price variation
      const numProducts = 8 + Math.floor(Math.random() * 5);
      const shuffled = [...productTemplates].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(numProducts, shuffled.length); i++) {
        const t = shuffled[i];
        const priceVariation = 0.85 + Math.random() * 0.3; // ±15% price variation
        await Product.create({
          vendorId: vendor._id, name: t.name,
          category: catMap[t.cat], price: Math.round(t.price * priceVariation),
          mrp: t.mrp, unit: t.unit, stock: t.stock + Math.floor(Math.random() * 20),
          isVeg: t.isVeg, tags: t.tags, isAvailable: true, lowStockThreshold: 5,
          totalSold: Math.floor(Math.random() * 50),
          avgRating: 3 + Math.random() * 2
        });
      }
    }

    // Create delivery partners
    console.log('🚚 Creating delivery partners...');
    const dpNames = ['Raju Driver', 'Sonu Delivery', 'Karan Rider'];
    for (let i = 0; i < 3; i++) {
      const loc = locations[i + 3];
      const user = await User.create({
        name: dpNames[i], phone: `97000000${10 + i}`, password: 'delivery123',
        role: 'delivery', isVerified: true,
        address: { street: loc.area, city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { lat: loc.lat, lng: loc.lng } }
      });
      await DeliveryPartner.create({
        userId: user._id, vehicleType: 'motorcycle', isOnline: true, isAvailable: true, isVerified: true,
        currentLocation: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        rating: 4 + Math.random()
      });
    }

    const totalProducts = await Product.countDocuments();
    console.log(`\n✅ Seed complete!`);
    console.log(`   👑 Admin: phone=9999999999, pass=admin123`);
    console.log(`   👥 Customers: phone=9800000010-14, pass=user123`);
    console.log(`   🏪 Vendors: phone=981000000x01, pass=vendor123`);
    console.log(`   🚚 Delivery: phone=9700000010-12, pass=delivery123`);
    console.log(`   📦 Products: ${totalProducts}`);
    console.log(`   📂 Categories: ${cats.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
