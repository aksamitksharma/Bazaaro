const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const connectDB = async () => {
  try {
    // First try the configured MongoDB URI
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bazaaro';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`⚠️  MongoDB not available: ${error.message}`);
    console.log('🧪 Starting in-memory MongoDB for development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log(`✅ In-Memory MongoDB Connected: ${memUri}`);
      console.log('⚠️  Data will NOT persist after server restart!\n');

      // Auto-seed development data after in-memory DB is ready
      process.env.AUTO_SEED = 'true';
    } catch (memError) {
      console.error(`❌ Failed to start in-memory MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
