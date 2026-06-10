import dns from 'dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let isReconnecting = false;

const mongoConnect = async (retryCount = 0) => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/securechat';

    // If SRV lookup is failing, fall back to non-SRV format
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(uri, opts);
    console.log('✅ MongoDB connected successfully');
    isReconnecting = false;
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      if (process.env.MONGODB_URI?.startsWith('mongodb+srv://')) {
        console.log('ℹ️ SRV lookup failed. Use MONGODB_URI with direct connection string (mongodb://) instead of mongodb+srv://');
      }
    }

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return mongoConnect(retryCount + 1);
    }

    console.error('❌ All MongoDB connection attempts failed. Server will continue without database.');
    isReconnecting = false;
  }
};

mongoose.connection.on('disconnected', () => {
  if (isReconnecting) return;
  isReconnecting = true;
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  mongoConnect();
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ MongoDB error:', err.message);
});

export default mongoConnect;
