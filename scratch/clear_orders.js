const mongoose = require('mongoose');
const Order = require('../server/models/Order');
const DeliveryPartner = require('../server/models/DeliveryPartner');
require('dotenv').config({ path: '../server/.env' });

async function clearOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bazaaro');
    const delResult = await Order.deleteMany({});
    console.log(`Deleted ${delResult.deletedCount} orders.`);
    
    // Also reset delivery partners state just in case they are stuck with currentOrderId
    await DeliveryPartner.updateMany({}, { $set: { currentOrderId: null, isAvailable: true }});
    console.log('Reset delivery partners state.');
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

clearOrders();
