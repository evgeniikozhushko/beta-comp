import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { mongoConnect, withTransaction } from '@/lib/mongodb';

/**
 * GET /api/debug/verify-transaction
 *
 * Tests MongoDB transaction support by:
 * 1. Creating a test document WITH a transaction
 * 2. Verifying it persists after transaction commits
 * 3. Creating a test document WITHOUT a transaction for comparison
 * 4. Cleaning up test documents
 *
 * This helps diagnose if transactions are working properly
 */
export async function GET() {
  const testResults = {
    connectionTest: { success: false, message: '' },
    replicaSetCheck: { isReplicaSet: false, message: '', name: 'N/A' },
    transactionTest: { success: false, message: '', documentId: null as string | null, persistedAfterCommit: false },
    nonTransactionTest: { success: false, message: '', documentId: null as string | null },
    comparison: { message: '' }
  };

  try {
    console.log('🧪 Starting transaction verification tests...');

    // Test 1: Connection test
    console.log('📡 Test 1: Verifying MongoDB connection...');
    await mongoConnect();
    testResults.connectionTest.success = true;
    testResults.connectionTest.message = 'Successfully connected to MongoDB';
    console.log('✅ Connection test passed');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Test 2: Replica set check
    console.log('🔍 Test 2: Checking replica set configuration...');
    try {
      const admin = db.admin();
      const serverStatus = await admin.serverStatus();

      if (serverStatus.repl) {
        testResults.replicaSetCheck.isReplicaSet = true;
        testResults.replicaSetCheck.name = serverStatus.repl.setName || 'unknown';
        testResults.replicaSetCheck.message = `Replica set detected: ${testResults.replicaSetCheck.name}. Transactions are supported.`;
        console.log('✅ Replica set check passed:', testResults.replicaSetCheck.name);
      } else {
        testResults.replicaSetCheck.isReplicaSet = false;
        testResults.replicaSetCheck.message = 'Standalone MongoDB instance detected. Transactions require a replica set.';
        console.log('⚠️ Not a replica set - transactions not supported');
      }
    } catch (error) {
      testResults.replicaSetCheck.message = `Unable to determine replica set status: ${error instanceof Error ? error.message : String(error)}`;
      console.log('⚠️ Replica set check inconclusive:', testResults.replicaSetCheck.message);
    }

    const testCollection = db.collection('_transaction_test');

    // Test 3: Transaction test
    console.log('🔄 Test 3: Testing transaction-based document creation...');
    try {
      const transactionDocId = 'tx-test-' + Date.now();

      await withTransaction(async (session) => {
        console.log('  💾 Creating document within transaction...');
        await testCollection.insertOne(
          { _id: transactionDocId, test: 'transaction', timestamp: new Date() },
          { session }
        );
        console.log('  ✅ Document created within transaction scope');

        // Check if document exists within transaction
        const docInTransaction = await testCollection.findOne({ _id: transactionDocId }, { session });
        if (!docInTransaction) {
          throw new Error('Document not found within transaction scope');
        }
        console.log('  ✅ Document verified within transaction scope');
      });

      console.log('  🔍 Verifying document persisted after transaction commit...');
      // Wait a moment for transaction to fully commit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if document exists OUTSIDE transaction scope (after commit)
      const docAfterCommit = await testCollection.findOne({ _id: transactionDocId });

      if (docAfterCommit) {
        testResults.transactionTest.success = true;
        testResults.transactionTest.persistedAfterCommit = true;
        testResults.transactionTest.documentId = transactionDocId;
        testResults.transactionTest.message = 'Transaction test PASSED: Document persisted after commit';
        console.log('✅ Transaction test PASSED');
      } else {
        testResults.transactionTest.success = false;
        testResults.transactionTest.persistedAfterCommit = false;
        testResults.transactionTest.documentId = transactionDocId;
        testResults.transactionTest.message = 'Transaction test FAILED: Document created within transaction but did NOT persist after commit. This is the root cause of your issue!';
        console.log('❌ Transaction test FAILED - document not persisted');
      }

      // Cleanup
      await testCollection.deleteOne({ _id: transactionDocId });
      console.log('  🧹 Cleaned up transaction test document');

    } catch (error) {
      testResults.transactionTest.success = false;
      testResults.transactionTest.message = `Transaction test ERROR: ${error instanceof Error ? error.message : String(error)}`;
      console.log('❌ Transaction test error:', testResults.transactionTest.message);
    }

    // Test 4: Non-transaction test (for comparison)
    console.log('📝 Test 4: Testing direct document creation (without transaction)...');
    try {
      const directDocId = 'direct-test-' + Date.now();

      console.log('  💾 Creating document without transaction...');
      const result = await testCollection.insertOne({
        _id: directDocId,
        test: 'direct',
        timestamp: new Date()
      });

      console.log('  🔍 Verifying document persisted...');
      const docAfterInsert = await testCollection.findOne({ _id: directDocId });

      if (docAfterInsert && result.acknowledged) {
        testResults.nonTransactionTest.success = true;
        testResults.nonTransactionTest.documentId = directDocId;
        testResults.nonTransactionTest.message = 'Non-transaction test PASSED: Document persisted successfully';
        console.log('✅ Non-transaction test PASSED');
      } else {
        testResults.nonTransactionTest.success = false;
        testResults.nonTransactionTest.message = 'Non-transaction test FAILED: Document did not persist';
        console.log('❌ Non-transaction test FAILED');
      }

      // Cleanup
      await testCollection.deleteOne({ _id: directDocId });
      console.log('  🧹 Cleaned up non-transaction test document');

    } catch (error) {
      testResults.nonTransactionTest.success = false;
      testResults.nonTransactionTest.message = `Non-transaction test ERROR: ${error instanceof Error ? error.message : String(error)}`;
      console.log('❌ Non-transaction test error:', testResults.nonTransactionTest.message);
    }

    // Test 5: Comparison and recommendation
    console.log('📊 Test 5: Analyzing results...');
    if (testResults.transactionTest.persistedAfterCommit && testResults.nonTransactionTest.success) {
      testResults.comparison.message = '✅ Both transaction and non-transaction writes work correctly. Your MongoDB setup supports transactions properly.';
    } else if (!testResults.transactionTest.persistedAfterCommit && testResults.nonTransactionTest.success) {
      testResults.comparison.message = '⚠️ ISSUE FOUND: Non-transaction writes work, but transaction writes do NOT persist. This is why your events are not saving. Recommendation: Update code to use write concern or remove transactions.';
    } else if (testResults.transactionTest.persistedAfterCommit && !testResults.nonTransactionTest.success) {
      testResults.comparison.message = '❓ Unusual: Transactions work but direct writes fail. Check your MongoDB configuration.';
    } else {
      testResults.comparison.message = '❌ CRITICAL: Neither transactions nor direct writes are working. Check your MongoDB connection and permissions.';
    }

    console.log('🎉 Transaction verification tests completed');
    console.log('📋 Result:', testResults.comparison.message);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: testResults.comparison.message,
      results: testResults,
      recommendation: !testResults.transactionTest.persistedAfterCommit
        ? 'Your MongoDB cluster does not properly support transactions. You need to either: (1) Upgrade to a paid tier that fully supports replica set transactions, (2) Add write concern parameters to your connection string and transaction code, or (3) Remove transactions from your event creation code.'
        : 'Your MongoDB setup is working correctly. The issue may be elsewhere in your code.'
    });

  } catch (error) {
    console.error('❌ Transaction verification failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      results: testResults
    }, { status: 500 });
  }
}
