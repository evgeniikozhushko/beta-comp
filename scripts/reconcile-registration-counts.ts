#!/usr/bin/env tsx

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { reconcileRegistrationCounts, formatReconciliationReport } from "../src/lib/reconciliation";

async function main() {
  console.log("🔄 Starting registration count reconciliation...");

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const autoFix = args.includes('--fix') || args.includes('-f');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const eventId = args.find(arg => arg.startsWith('--event='))?.split('=')[1];

  // Validate arguments
  if (autoFix && dryRun) {
    console.error("❌ Cannot use both --fix and --dry-run options together");
    process.exit(1);
  }

  // Show configuration
  console.log("⚙️  Configuration:");
  console.log(`   • Mode: ${dryRun ? 'DRY RUN' : autoFix ? 'AUTO-FIX' : 'CHECK ONLY'}`);
  console.log(`   • Scope: ${eventId ? `Single event (${eventId})` : 'All events'}`);
  console.log(`   • Verbose: ${verbose ? 'Yes' : 'No'}`);
  console.log("");

  try {
    // Run reconciliation
    const report = await reconcileRegistrationCounts({
      dryRun,
      autoFix,
      eventId,
      includeOrphaned: true
    });

    // Show detailed report if verbose or if there are issues
    if (verbose || report.discrepanciesFound > 0 || report.orphanedRegistrations > 0 || report.errors.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log(formatReconciliationReport(report));
      console.log("=".repeat(60));
    }

    // Exit codes
    if (report.errors.length > 0) {
      console.log("\n💥 Reconciliation completed with errors");
      process.exit(2);
    } else if (report.discrepanciesFound > 0 || report.orphanedRegistrations > 0) {
      if (dryRun) {
        console.log("\n⚠️  Issues found - run with --fix to resolve them");
        process.exit(1);
      } else if (autoFix) {
        console.log("\n✅ Issues found and resolved");
        process.exit(0);
      } else {
        console.log("\n⚠️  Issues found - run with --fix to resolve them");
        process.exit(1);
      }
    } else {
      console.log("\n🎉 All registration counts are accurate!");
      process.exit(0);
    }

  } catch (error) {
    console.error("\n💥 Reconciliation failed:", error);
    process.exit(3);
  }
}

// Help text
function showHelp() {
  console.log(`
📊 Registration Count Reconciliation Script

This script checks and fixes discrepancies between stored registration counts 
in Event documents and actual counts from Registration documents.

Usage:
  npm run reconcile:counts [options]

Options:
  --dry-run, -d     Check for discrepancies without making changes
  --fix, -f         Automatically fix found discrepancies
  --verbose, -v     Show detailed report
  --event=<id>      Check only specific event by ID
  --help, -h        Show this help message

Examples:
  npm run reconcile:counts --dry-run          # Check all events, no changes
  npm run reconcile:counts --fix              # Fix all discrepancies
  npm run reconcile:counts --event=123 --fix  # Fix specific event
  npm run reconcile:counts --verbose          # Detailed output

Exit Codes:
  0 - Success (no issues found or all issues fixed)
  1 - Issues found (use --fix to resolve)
  2 - Completed with errors
  3 - Script failure

⚠️  Important Notes:
  • Always run with --dry-run first to see what would be changed
  • This script uses database transactions for safe modifications
  • Orphaned registrations are marked as 'cancelled', not deleted
  • A backup of your data is recommended before running fixes
`);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Check if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(3);
  });
}

export default main;