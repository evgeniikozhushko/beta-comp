// lib/reconciliation.ts

import { Types } from 'mongoose';
import { mongoConnect, withTransaction } from './mongodb';
import Event from './models/Event';
import Registration from './models/Registration';

export interface EventDiscrepancy {
  eventId: string;
  eventName: string;
  eventDate: string;
  storedRegistered: number;
  actualRegistered: number;
  storedWaitlisted: number;
  actualWaitlisted: number;
  registeredDiff: number;
  waitlistedDiff: number;
}

export interface ReconciliationReport {
  timestamp: Date;
  eventsChecked: number;
  discrepanciesFound: number;
  discrepancies: EventDiscrepancy[];
  fixesApplied: number;
  orphanedRegistrations: number;
  errors: string[];
}

export interface ReconciliationOptions {
  dryRun?: boolean;
  autoFix?: boolean;
  eventId?: string; // Check specific event only
  includeOrphaned?: boolean;
}

/**
 * Reconcile registration counts for all events or a specific event
 */
export async function reconcileRegistrationCounts(
  options: ReconciliationOptions = {}
): Promise<ReconciliationReport> {
  const {
    dryRun = false,
    autoFix = false,
    eventId = null,
    includeOrphaned = true
  } = options;

  const report: ReconciliationReport = {
    timestamp: new Date(),
    eventsChecked: 0,
    discrepanciesFound: 0,
    discrepancies: [],
    fixesApplied: 0,
    orphanedRegistrations: 0,
    errors: []
  };

  try {
    await mongoConnect();

    // Build query for events to check
    const eventQuery = eventId ? { _id: new Types.ObjectId(eventId) } : {};
    const events = await Event.find(eventQuery).lean();

    report.eventsChecked = events.length;

    console.log(`🔍 Checking ${events.length} event(s) for count discrepancies...`);

    // Check each event
    for (const event of events) {
      try {
        const discrepancy = await checkEventCounts(event);
        if (discrepancy) {
          report.discrepancies.push(discrepancy);
          report.discrepanciesFound++;

          console.log(`⚠️  Discrepancy found in event "${discrepancy.eventName}":`);
          console.log(`   Registered: ${discrepancy.storedRegistered} stored vs ${discrepancy.actualRegistered} actual (${discrepancy.registeredDiff > 0 ? '+' : ''}${discrepancy.registeredDiff})`);
          console.log(`   Waitlisted: ${discrepancy.storedWaitlisted} stored vs ${discrepancy.actualWaitlisted} actual (${discrepancy.waitlistedDiff > 0 ? '+' : ''}${discrepancy.waitlistedDiff})`);

          // Auto-fix if enabled and not dry run
          if (autoFix && !dryRun) {
            try {
              await fixEventCounts(String(event._id), discrepancy.actualRegistered, discrepancy.actualWaitlisted);
              report.fixesApplied++;
              console.log(`✅ Fixed counts for event "${discrepancy.eventName}"`);
            } catch (error) {
              const errorMsg = `Failed to fix counts for event ${discrepancy.eventName}: ${error}`;
              report.errors.push(errorMsg);
              console.error(`❌ ${errorMsg}`);
            }
          }
        }
      } catch (error) {
        const errorMsg = `Error checking event ${event.name}: ${error}`;
        report.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Check for orphaned registrations if requested
    if (includeOrphaned) {
      try {
        const orphanedCount = await findOrphanedRegistrations();
        report.orphanedRegistrations = orphanedCount;
        
        if (orphanedCount > 0) {
          console.log(`⚠️  Found ${orphanedCount} orphaned registration(s)`);
          if (autoFix && !dryRun) {
            await cleanupOrphanedRegistrations();
            console.log(`🗑️  Cleaned up ${orphanedCount} orphaned registration(s)`);
          }
        }
      } catch (error) {
        const errorMsg = `Error checking orphaned registrations: ${error}`;
        report.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Summary
    if (report.discrepanciesFound === 0 && report.orphanedRegistrations === 0) {
      console.log(`✅ All ${report.eventsChecked} event(s) have accurate counts`);
    } else {
      console.log(`📊 Summary:`);
      console.log(`   • Events checked: ${report.eventsChecked}`);
      console.log(`   • Discrepancies found: ${report.discrepanciesFound}`);
      console.log(`   • Orphaned registrations: ${report.orphanedRegistrations}`);
      
      if (dryRun) {
        console.log(`   • Mode: DRY RUN (no changes made)`);
      } else if (autoFix) {
        console.log(`   • Fixes applied: ${report.fixesApplied}`);
      }
      
      if (report.errors.length > 0) {
        console.log(`   • Errors: ${report.errors.length}`);
      }
    }

  } catch (error) {
    const errorMsg = `Reconciliation failed: ${error}`;
    report.errors.push(errorMsg);
    console.error(`💥 ${errorMsg}`);
  }

  return report;
}

/**
 * Check counts for a specific event
 */
async function checkEventCounts(event: Record<string, unknown> & { _id: unknown }): Promise<EventDiscrepancy | null> {
  // Get actual counts from Registration collection
  const [actualRegistered, actualWaitlisted] = await Promise.all([
    Registration.countDocuments({
      eventId: event._id,
      status: 'registered'
    }),
    Registration.countDocuments({
      eventId: event._id,
      status: 'waitlisted'
    })
  ]);

  // Get stored counts from Event document
  const storedRegistered = Number(event.registrationCount) || 0;
  const storedWaitlisted = Number(event.waitlistCount) || 0;

  // Calculate differences
  const registeredDiff = actualRegistered - storedRegistered;
  const waitlistedDiff = actualWaitlisted - storedWaitlisted;

  // Return discrepancy if counts don't match
  if (registeredDiff !== 0 || waitlistedDiff !== 0) {
    return {
      eventId: String(event._id),
      eventName: String(event.name),
      eventDate: new Date(event.date as Date).toISOString(),
      storedRegistered,
      actualRegistered,
      storedWaitlisted,
      actualWaitlisted,
      registeredDiff,
      waitlistedDiff
    };
  }

  return null;
}

/**
 * Fix counts for a specific event using transaction
 */
async function fixEventCounts(eventId: string, correctRegistered: number, correctWaitlisted: number): Promise<void> {
  await withTransaction(async (session) => {
    await Event.findByIdAndUpdate(
      eventId,
      {
        registrationCount: correctRegistered,
        waitlistCount: correctWaitlisted
      },
      { session }
    );
  });
}

/**
 * Find registrations that reference non-existent events
 */
async function findOrphanedRegistrations(): Promise<number> {
  // Use aggregation to find registrations with invalid eventId references
  const orphaned = await Registration.aggregate([
    {
      $lookup: {
        from: 'events',
        localField: 'eventId',
        foreignField: '_id',
        as: 'event'
      }
    },
    {
      $match: {
        event: { $size: 0 }, // No matching event found
        status: { $in: ['registered', 'waitlisted'] } // Only active registrations
      }
    },
    {
      $count: 'orphaned'
    }
  ]);

  return orphaned.length > 0 ? orphaned[0].orphaned : 0;
}

/**
 * Remove orphaned registrations
 */
async function cleanupOrphanedRegistrations(): Promise<void> {
  await withTransaction(async (session) => {
    // Find orphaned registrations
    const orphaned = await Registration.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $match: {
          event: { $size: 0 },
          status: { $in: ['registered', 'waitlisted'] }
        }
      },
      {
        $project: { _id: 1 }
      }
    ]).session(session);

    if (orphaned.length > 0) {
      const orphanedIds = orphaned.map(r => r._id);
      
      // Mark as cancelled instead of deleting to preserve audit trail
      await Registration.updateMany(
        { _id: { $in: orphanedIds } },
        { status: 'cancelled' },
        { session }
      );
    }
  });
}

/**
 * Generate a detailed reconciliation report for display
 */
export function formatReconciliationReport(report: ReconciliationReport): string {
  const lines = [];
  
  lines.push(`📊 Registration Count Reconciliation Report`);
  lines.push(`🕐 Timestamp: ${report.timestamp.toISOString()}`);
  lines.push(`📈 Events Checked: ${report.eventsChecked}`);
  lines.push(`⚠️  Discrepancies Found: ${report.discrepanciesFound}`);
  lines.push(`🔧 Fixes Applied: ${report.fixesApplied}`);
  lines.push(`🗑️  Orphaned Registrations: ${report.orphanedRegistrations}`);
  lines.push(`❌ Errors: ${report.errors.length}`);
  
  if (report.discrepancies.length > 0) {
    lines.push(`\n🔍 Event Discrepancies:`);
    report.discrepancies.forEach((disc, index) => {
      lines.push(`\n${index + 1}. ${disc.eventName} (${disc.eventId})`);
      lines.push(`   📅 Date: ${disc.eventDate}`);
      lines.push(`   👥 Registered: ${disc.storedRegistered} → ${disc.actualRegistered} (${disc.registeredDiff > 0 ? '+' : ''}${disc.registeredDiff})`);
      lines.push(`   ⏳ Waitlisted: ${disc.storedWaitlisted} → ${disc.actualWaitlisted} (${disc.waitlistedDiff > 0 ? '+' : ''}${disc.waitlistedDiff})`);
    });
  }
  
  if (report.errors.length > 0) {
    lines.push(`\n❌ Errors Encountered:`);
    report.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error}`);
    });
  }
  
  return lines.join('\n');
}