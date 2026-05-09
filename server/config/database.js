import dns from 'dns';
import mongoose from 'mongoose';

// Some environments block or mis-handle local SRV DNS resolution.
// Force Node to use public DNS servers for MongoDB Atlas SRV lookups.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securechat');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default mongoConnect;
