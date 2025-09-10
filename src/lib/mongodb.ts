// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Define the global type properly
declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function mongoConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
    }).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error);
      // Reset the promise so we can retry
      cached.promise = null;
      throw error;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Execute a database operation within a MongoDB transaction
 * Provides atomicity and automatic rollback on errors
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  console.log('🔧 Starting MongoDB session...');
  const session = await mongoose.startSession();
  console.log('✅ MongoDB session created');
  
  try {
    console.log('🔄 Starting transaction...');
    const result = await session.withTransaction(async () => {
      console.log('⚡ Inside transaction, executing operation...');
      const operationResult = await operation(session);
      console.log('✅ Operation completed successfully');
      return operationResult;
    });
    console.log('✅ Transaction committed successfully');
    return result;
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    throw error;
  } finally {
    console.log('🔧 Ending MongoDB session...');
    await session.endSession();
    console.log('✅ MongoDB session ended');
  }
}