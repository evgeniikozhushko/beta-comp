#!/usr/bin/env tsx

import { mongoConnect } from "../src/lib/mongodb";
import User from "../src/lib/models/User";

async function migrateUserRoles() {
  console.log("🔄 Starting user role migration...");

  try {
    // Connect to MongoDB
    await mongoConnect();
    console.log("✅ Connected to MongoDB");

    // Find all users without a role field or with undefined role
    const usersToMigrate = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: undefined }
      ]
    });

    console.log(`📊 Found ${usersToMigrate.length} users to migrate`);

    if (usersToMigrate.length === 0) {
      console.log("✅ No users need migration - all users already have roles assigned");
      return;
    }

    let ownerAssigned = false;
    let migrationCount = 0;

    for (const user of usersToMigrate) {
      let role = 'athlete'; // Default role

      // Check if this is the owner email
      if (user.email === 'evgeniimedium@gmail.com') {
        role = 'owner';
        ownerAssigned = true;
        console.log(`👑 Assigning OWNER role to: ${user.email} (${user.displayName})`);
      } else {
        console.log(`👤 Assigning ATHLETE role to: ${user.email || 'No email'} (${user.displayName})`);
      }

      // Update the user with the role
      await User.findByIdAndUpdate(user._id, { role: role });
      migrationCount++;
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   • Total users migrated: ${migrationCount}`);
    console.log(`   • Owner role assigned: ${ownerAssigned ? '✅ Yes' : '❌ No'}`);

    // Verify the migration by checking all users now have roles
    const usersWithoutRoles = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: undefined }
      ]
    });

    if (usersWithoutRoles.length === 0) {
      console.log("✅ Migration successful - all users now have roles assigned");
    } else {
      console.log(`⚠️  Warning: ${usersWithoutRoles.length} users still don't have roles`);
    }

    // Show final role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log("\n📊 Final role distribution:");
    roleDistribution.forEach(role => {
      console.log(`   • ${role._id}: ${role.count} users`);
    });

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Check if this script is run directly
if (require.main === module) {
  migrateUserRoles()
    .then(() => {
      console.log("\n🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export default migrateUserRoles;