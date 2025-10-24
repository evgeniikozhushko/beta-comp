import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { mongoConnect } from '@/lib/mongodb';

/**
 * GET /api/debug/db-info
 *
 * Provides comprehensive information about the MongoDB connection
 * to help debug why events aren't appearing in the database
 */
export async function GET() {
  try {
    console.log('🔍 Starting database inspection...');

    // Connect to MongoDB
    await mongoConnect();
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not established'
      }, { status: 500 });
    }

    // Get admin access for listing databases
    const admin = db.admin();

    // 1. List all databases
    console.log('📊 Listing all databases...');
    let databases: { name: string; sizeOnDisk?: number; empty?: boolean }[] = [];
    try {
      const dbList = await admin.listDatabases();
      databases = dbList.databases.map((db: { name: string; sizeOnDisk?: number; empty?: boolean }) => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk,
        empty: db.empty
      }));
      console.log('✅ Found databases:', databases.map(d => d.name).join(', '));
    } catch (error) {
      console.log('⚠️ Could not list databases (permission issue on free tier):', error instanceof Error ? error.message : String(error));
      databases = [{ name: db.databaseName, sizeOnDisk: 0, empty: false }];
    }

    // 2. Get current database name
    const currentDatabase = db.databaseName;
    console.log('📍 Current database:', currentDatabase);

    // 3. List all collections in current database
    console.log('📦 Listing collections in', currentDatabase);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col: { name: string }) => col.name);
    console.log('✅ Found collections:', collectionNames.join(', '));

    // 4. Get document counts for each collection
    console.log('🔢 Counting documents in each collection...');
    const collectionStats = await Promise.all(
      collectionNames.map(async (name: string) => {
        try {
          const count = await db.collection(name).countDocuments();
          const indexes = await db.collection(name).indexes();
          return {
            name,
            documentCount: count,
            indexCount: indexes.length
          };
        } catch (error) {
          return {
            name,
            documentCount: 0,
            indexCount: 0,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );
    console.log('✅ Collection stats gathered');

    // 5. Check connection details
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // 6. Check replica set status (for transaction support)
    let replicaSetStatus = 'unknown';
    let replicaSetName = 'N/A';
    try {
      const serverStatus = await admin.serverStatus();
      if (serverStatus.repl) {
        replicaSetStatus = serverStatus.repl.ismaster ? 'primary' : 'secondary';
        replicaSetName = serverStatus.repl.setName || 'N/A';
      } else {
        replicaSetStatus = 'standalone (no replica set - transactions not supported)';
      }
      console.log('✅ Replica set status:', replicaSetStatus);
    } catch (error) {
      console.log('⚠️ Could not get replica set status:', error instanceof Error ? error.message : String(error));
      replicaSetStatus = 'unable to determine';
    }

    // 7. Get specific info about 'events' collection
    const eventsCollection = collectionStats.find((col: { name: string }) => col.name === 'events');
    let eventsSample = [];
    if (eventsCollection && eventsCollection.documentCount > 0) {
      console.log('📋 Fetching sample events...');
      eventsSample = await db.collection('events')
        .find({})
        .limit(5)
        .project({ name: 1, date: 1, createdAt: 1, createdBy: 1 })
        .toArray();
      console.log('✅ Sample events fetched:', eventsSample.length);
    }

    // 8. Connection string info (sanitized)
    const connectionString = process.env.MONGODB_URI || '';
    const sanitizedConnectionString = connectionString
      .replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@')
      .replace(/\?.*$/, '?<params>');

    // 9. Test write concern acknowledgment
    console.log('✍️ Testing write acknowledgment...');
    let writeTest = {
      supported: false,
      error: null as string | null
    };
    try {
      const testCollection = db.collection('_write_test');
      const testDoc = { _id: 'test-' + Date.now(), timestamp: new Date() };
      const result = await testCollection.insertOne(testDoc, {
        writeConcern: { w: 'majority', wtimeout: 5000 }
      });
      await testCollection.deleteOne({ _id: testDoc._id });
      writeTest.supported = result.acknowledged === true;
      console.log('✅ Write test completed:', writeTest.supported);
    } catch (error) {
      writeTest.error = error instanceof Error ? error.message : String(error);
      console.log('❌ Write test failed:', writeTest.error);
    }

    console.log('🎉 Database inspection completed');

    // Return comprehensive diagnostic information
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      connection: {
        state: connectionStates[connectionState as keyof typeof connectionStates] || 'unknown',
        currentDatabase,
        connectionString: sanitizedConnectionString,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      replicaSet: {
        status: replicaSetStatus,
        name: replicaSetName,
        transactionsSupported: replicaSetStatus !== 'standalone (no replica set - transactions not supported)'
      },
      databases,
      collections: {
        total: collectionNames.length,
        names: collectionNames,
        stats: collectionStats
      },
      eventsCollection: eventsCollection || null,
      eventsSample: eventsSample.length > 0 ? eventsSample : null,
      writeTest,
      diagnostics: {
        hasEventsCollection: collectionNames.includes('events'),
        eventsCount: eventsCollection?.documentCount || 0,
        recommendation: eventsCollection && eventsCollection.documentCount === 0
          ? 'Events collection exists but is empty. Events may be failing to persist.'
          : !collectionNames.includes('events')
          ? 'Events collection does not exist. Events are not being created at all.'
          : 'Events collection has data. Check if you are looking at the correct database/collection.'
      }
    });

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
