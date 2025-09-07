import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types/permissions';
import { reconcileRegistrationCounts, ReconciliationOptions } from '@/lib/reconciliation';

interface ReconcileRequestBody {
  dryRun?: boolean;
  autoFix?: boolean;
  eventId?: string;
  includeOrphaned?: boolean;
}

/**
 * POST /api/admin/reconcile
 * Run registration count reconciliation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Permission check - only Owner/Admin can run reconciliation
    if (!hasPermission(session.user.role, 'canManageEvents')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Admin access required.' 
      }, { status: 403 });
    }

    // 3. Parse request body
    let options: ReconciliationOptions = {
      dryRun: true, // Default to dry run for safety
      autoFix: false,
      includeOrphaned: true
    };

    try {
      const body = await request.json() as ReconcileRequestBody;
      options = {
        dryRun: body.dryRun ?? true,
        autoFix: body.autoFix ?? false,
        eventId: body.eventId || undefined,
        includeOrphaned: body.includeOrphaned ?? true
      };
    } catch (error) {
      // Use defaults if JSON parsing fails
      console.log('Using default options for reconciliation');
    }

    // 4. Validation
    if (options.autoFix && options.dryRun) {
      return NextResponse.json({
        error: 'Cannot use both autoFix and dryRun options together'
      }, { status: 400 });
    }

    // 5. Log the reconciliation request
    console.log(`🔄 Reconciliation requested by ${session.user.displayName} (${session.user.role})`);
    console.log(`Options:`, options);

    // 6. Run reconciliation
    const report = await reconcileRegistrationCounts(options);

    // 7. Log completion
    console.log(`✅ Reconciliation completed by ${session.user.displayName}`);
    console.log(`Summary: ${report.eventsChecked} events checked, ${report.discrepanciesFound} discrepancies found, ${report.fixesApplied} fixes applied`);

    // 8. Return detailed report
    return NextResponse.json({
      success: true,
      report,
      summary: {
        mode: options.dryRun ? 'dry_run' : options.autoFix ? 'auto_fix' : 'check_only',
        eventsChecked: report.eventsChecked,
        discrepanciesFound: report.discrepanciesFound,
        fixesApplied: report.fixesApplied,
        orphanedRegistrations: report.orphanedRegistrations,
        hasErrors: report.errors.length > 0,
        timestamp: report.timestamp
      }
    });

  } catch (error) {
    console.error('Admin reconciliation error:', error);
    return NextResponse.json({
      error: 'Reconciliation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/reconcile
 * Get reconciliation status/info (for UI display)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Permission check
    if (!hasPermission(session.user.role, 'canManageEvents')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Admin access required.' 
      }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || undefined;

    // 4. Run dry run check to get current status
    const report = await reconcileRegistrationCounts({
      dryRun: true,
      autoFix: false,
      eventId,
      includeOrphaned: true
    });

    // 5. Return status
    return NextResponse.json({
      success: true,
      status: {
        eventsChecked: report.eventsChecked,
        discrepanciesFound: report.discrepanciesFound,
        orphanedRegistrations: report.orphanedRegistrations,
        hasIssues: report.discrepanciesFound > 0 || report.orphanedRegistrations > 0,
        lastChecked: report.timestamp,
        discrepancies: report.discrepancies.map(disc => ({
          eventId: disc.eventId,
          eventName: disc.eventName,
          registeredDiff: disc.registeredDiff,
          waitlistedDiff: disc.waitlistedDiff
        }))
      }
    });

  } catch (error) {
    console.error('Get reconciliation status error:', error);
    return NextResponse.json({
      error: 'Failed to get reconciliation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}