import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostguard';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[HostGuard DB] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[HostGuard DB] MongoDB Connection Error: ${err.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw err;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[HostGuard DB] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error(`[HostGuard DB] Disconnect error: ${err.message}`);
  }
};
