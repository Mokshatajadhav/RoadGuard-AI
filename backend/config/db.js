import dns from 'dns';
import mongoose from 'mongoose';

// Fix for Windows systems where the default DNS resolver cannot resolve
// MongoDB Atlas SRV records. Use Google and Cloudflare public DNS servers.
dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Connect to MongoDB database using Mongoose.
 * Reads connection string from process.env.MONGODB_URI.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined in environment variables. ' +
      'Please create a backend/.env file with MONGODB_URI set to your MongoDB Atlas connection string.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.name} @ ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    throw error;
  }
}
