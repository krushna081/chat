import 'dotenv/config';
import mongoose from 'mongoose';

async function checkMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  console.log('Testing MongoDB URI:', uri);
  await mongoose.connect(uri, { connectTimeoutMS: 5000 });
  console.log('MongoDB connection succeeded');
  await mongoose.connection.close();
}

checkMongo().catch(error => {
  console.error('MongoDB connection failed:', error.message || error);
  process.exit(1);
});
