import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

const mongoConnect = async (retryCount = 0) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securechat');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return mongoConnect(retryCount + 1);
    }

    console.error('❌ All MongoDB connection attempts failed. Server will continue without database.');
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  mongoConnect();
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ MongoDB error:', err.message);
});

export default mongoConnect;
