import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

if (env.mongodbDnsServers.length > 0) {
  dns.setServers(env.mongodbDnsServers);
}

mongoose.set('strictQuery', true);

export const connectDatabase = async () => {
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    maxPoolSize: 10,
  });
  console.info('MongoDB connected');
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const isDatabaseReady = () => mongoose.connection.readyState === 1;

export default connectDatabase;
