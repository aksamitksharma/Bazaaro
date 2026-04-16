const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Attach io to app for use in routes
app.set('io', io);

// Socket handler
socketHandler(io);

// Auto-seed function for in-memory DB
const autoSeed = async () => {
  try {
    const User = require('./models/User');
    const Vendor = require('./models/Vendor');
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    const DeliveryPartner = require('./models/DeliveryPartner');

    // Check if already seeded
    const count = await User.countDocuments();
    if (count > 0) return;

    console.log('\n🌱 Auto-seeding development data...');

    // Categories
    const categories = [
      { name: 'Groceries', slug: 'groceries', icon: '🛒', sortOrder: 1, subcategories: [
        { name: 'Fruits', slug: 'fruits' }, { name: 'Vegetables', slug: 'vegetables' },
        { name: 'Dairy', slug: 'dairy' }, { name: 'Grains', slug: 'grains' }
      ]},
      { name: 'Street Food', slug: 'street-food', icon: '🍔', sortOrder: 2, subcategories: [
        { name: 'Snacks', slug: 'snacks' }, { name: 'Chaat', slug: 'chaat' }
      ]},
      { name: 'Bakery', slug: 'bakery', icon: '🍞', sortOrder: 3, subcategories: [
        { name: 'Bread', slug: 'bread' }, { name: 'Cakes', slug: 'cakes' }
      ]},
      { name: 'Beverages', slug: 'beverages', icon: '🥤', sortOrder: 4, subcategories: [
        { name: 'Tea & Coffee', slug: 'tea-coffee' }, { name: 'Juices', slug: 'juices' }
      ]},
    ];
    const cats = await Category.insertMany(categories);
    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c._id);

    // Admin
    await User.create({
      name: 'Super Admin', phone: '9999999999', email: 'admin@bazaaro.com',
      password: 'admin123', role: 'admin', isVerified: true
    });

    // Customers
    const customerNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar'];
    for (let i = 0; i < 3; i++) {
      await User.create({
        name: customerNames[i], phone: `98000000${10 + i}`,
        password: 'user123', role: 'customer', isVerified: true,
        address: { street: 'Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { lat: 28.6139 + (Math.random() * 0.05), lng: 77.2090 + (Math.random() * 0.05) } }
      });
    }

    // Vendors
    const vendorData = [
      { name: 'Ramesh Kirana', shop: 'Ramesh General Store', cat: 'general', phone: '9810000001' },
      { name: 'Suresh Chaiwala', shop: 'Suresh Tea & Snacks', cat: 'food', phone: '9810000002' },
      { name: 'Meena Fruits', shop: 'Fresh Fruit Corner', cat: 'general', phone: '9810000003' },
    ];

    const vendors = [];
    for (const vd of vendorData) {
      const user = await User.create({
        name: vd.name, phone: vd.phone, password: 'vendor123', role: 'vendor', isVerified: true,
        address: { street: 'Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { lat: 28.6139 + (Math.random() * 0.05), lng: 77.2090 + (Math.random() * 0.05) } }
      });
      const vendor = await Vendor.create({
        userId: user._id, shopName: vd.shop, shopCategory: vd.cat,
        isApproved: true, isOpen: true, rating: 3.5 + Math.random() * 1.5,
        address: { street: 'Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { type: 'Point', coordinates: [77.2090 + (Math.random() * 0.05), 28.6139 + (Math.random() * 0.05)] } },
        deliveryRadius: 10, minOrderAmount: 50
      });
      vendors.push(vendor);
    }

    // Products
    const products = [
      { name: 'Basmati Rice', cat: 'groceries', price: 85, mrp: 100, unit: 'kg', stock: 50, tags: ['rice','grain'] },
      { name: 'Toor Dal', cat: 'groceries', price: 120, mrp: 140, unit: 'kg', stock: 30, tags: ['dal','lentils'] },
      { name: 'Amul Milk', cat: 'groceries', price: 28, mrp: 30, unit: 'litre', stock: 100, tags: ['milk','dairy'] },
      { name: 'Fresh Tomatoes', cat: 'groceries', price: 30, mrp: 40, unit: 'kg', stock: 40, tags: ['vegetable'] },
      { name: 'Onions', cat: 'groceries', price: 25, mrp: 35, unit: 'kg', stock: 60, tags: ['vegetable'] },
      { name: 'Potatoes', cat: 'groceries', price: 20, mrp: 30, unit: 'kg', stock: 80, tags: ['vegetable'] },
      { name: 'Samosa', cat: 'street-food', price: 15, mrp: 15, unit: 'piece', stock: 200, tags: ['snack'] },
      { name: 'Chai', cat: 'beverages', price: 10, mrp: 10, unit: 'piece', stock: 500, tags: ['tea'] },
      { name: 'White Bread', cat: 'bakery', price: 35, mrp: 40, unit: 'pack', stock: 30, tags: ['bread'] },
      { name: 'Chocolate Cake', cat: 'bakery', price: 350, mrp: 400, unit: 'piece', stock: 10, tags: ['cake'] },
    ];

    for (const vendor of vendors) {
      for (const p of products) {
        const priceVar = 0.85 + Math.random() * 0.3;
        await Product.create({
          vendorId: vendor._id, name: p.name,
          category: catMap[p.cat], price: Math.round(p.price * priceVar),
          mrp: p.mrp, unit: p.unit, stock: p.stock + Math.floor(Math.random() * 20),
          tags: p.tags, isAvailable: true, lowStockThreshold: 5,
        });
      }
    }

    // Delivery partners
    const dpNames = ['Raju Driver', 'Sonu Delivery'];
    for (let i = 0; i < 2; i++) {
      const user = await User.create({
        name: dpNames[i], phone: `97000000${10 + i}`, password: 'delivery123',
        role: 'delivery', isVerified: true,
        address: { street: 'Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001',
          coordinates: { lat: 28.63 + (Math.random() * 0.03), lng: 77.21 + (Math.random() * 0.03) } }
      });
      await DeliveryPartner.create({
        userId: user._id, vehicleType: 'motorcycle', isOnline: true, isAvailable: true, isVerified: true,
        currentLocation: { type: 'Point', coordinates: [77.21 + (Math.random() * 0.03), 28.63 + (Math.random() * 0.03)] },
        rating: 4 + Math.random()
      });
    }

    const totalProducts = await Product.countDocuments();
    console.log(`✅ Auto-seed complete!`);
    console.log(`   👑 Admin:    phone=9999999999, pass=admin123`);
    console.log(`   👥 Customer: phone=9800000010, pass=user123`);
    console.log(`   🏪 Vendor:   phone=9810000001, pass=vendor123`);
    console.log(`   🚚 Delivery: phone=9700000010, pass=delivery123`);
    console.log(`   📦 Products: ${totalProducts}\n`);
  } catch (err) {
    console.error('⚠️  Auto-seed error:', err.message);
  }
};

// Connect DB and start server
const start = async () => {
  await connectDB();

  // Auto-seed if using in-memory DB
  if (process.env.AUTO_SEED === 'true') {
    await autoSeed();
  }

  server.listen(PORT, () => {
    console.log(`\n🚀 Bazaaro API Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health\n`);
  });
};

start();
