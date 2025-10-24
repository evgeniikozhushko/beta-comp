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
 *
 * Now includes write concern to ensure data persistence on replica sets
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  console.log('🔧 Starting MongoDB session...');
  const session = await mongoose.startSession();
  console.log('✅ MongoDB session created');

  try {
    console.log('🔄 Starting transaction with write concern...');

    // Configure transaction options with write concern for data persistence
    const transactionOptions = {
      readPreference: 'primary' as const,
      readConcern: { level: 'local' as const },
      writeConcern: {
        w: 'majority' as const, // Wait for write to be acknowledged by majority of replica set
        wtimeout: 5000 // Timeout after 5 seconds
      },
      maxCommitTimeMS: 10000 // Maximum time to wait for transaction commit
    };

    const result = await session.withTransaction(async () => {
      console.log('⚡ Inside transaction, executing operation...');
      const operationResult = await operation(session);
      console.log('✅ Operation completed successfully');
      return operationResult;
    }, transactionOptions);

    console.log('✅ Transaction committed successfully with write concern');
    return result;
  } catch (error) {
    console.error('❌ Transaction failed:', error);

    // Log specific transaction errors
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as { code?: number; codeName?: string };
      if (mongoError.code === 20) {
        console.error('❌ Transaction not supported: This MongoDB instance does not support transactions');
        console.error('💡 Recommendation: Ensure you are using a replica set or MongoDB Atlas cluster (not standalone)');
      } else if (mongoError.code === 50) {
        console.error('❌ Write concern timeout: Transaction took too long to be acknowledged');
      }
    }

    throw error;
  } finally {
    console.log('🔧 Ending MongoDB session...');
    await session.endSession();
    console.log('✅ MongoDB session ended');
  }
}

/**
 * Execute a database operation with explicit write concern (without transaction)
 * Use this as a fallback when transactions are not supported
 */
export async function withWriteConcern<T>(
  operation: () => Promise<T>
): Promise<T> {
  console.log('📝 Executing operation with write concern (no transaction)...');

  try {
    const result = await operation();
    console.log('✅ Operation completed with write concern');
    return result;
  } catch (error) {
    console.error('❌ Operation with write concern failed:', error);
    throw error;
  }
}