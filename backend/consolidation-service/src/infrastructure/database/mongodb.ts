import mongoose from 'mongoose';

export async function initMongo(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/consolidation';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[MongoDB] Connected successfully to consolidation database.');
  } catch (error) {
    console.warn('[MongoDB] Warning: MongoDB connection failed:', error);
  }
}
