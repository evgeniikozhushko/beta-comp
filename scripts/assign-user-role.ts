#!/usr/bin/env tsx

import { mongoConnect } from "../src/lib/mongodb";
import User from "../src/lib/models/User";
import { UserRole } from "../src/lib/types/permissions";

const VALID_ROLES: UserRole[] = ['owner', 'admin', 'athlete', 'official'];

async function assignUserRole(email: string, newRole: UserRole) {
  console.log(`🔄 Assigning role "${newRole}" to user: ${email}`);

  try {
    // Validate role
    if (!VALID_ROLES.includes(newRole)) {
      console.error(`❌ Invalid role: "${newRole}". Valid roles are: ${VALID_ROLES.join(', ')}`);
      return false;
    }

    // Connect to MongoDB
    await mongoConnect();
    console.log("✅ Connected to MongoDB");

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      return false;
    }

    const oldRole = user.role;
    console.log(`👤 Found user: ${user.displayName} (Current role: ${oldRole})`);

    // Check if role is already assigned
    if (user.role === newRole) {
      console.log(`ℹ️  User already has role "${newRole}" - no changes needed`);
      return true;
    }

    // Warn about owner role changes
    if (oldRole === 'owner' && newRole !== 'owner') {
      console.log(`⚠️  WARNING: Removing OWNER role from ${user.displayName}!`);
    }
    
    if (newRole === 'owner' && oldRole !== 'owner') {
      console.log(`👑 Promoting ${user.displayName} to OWNER role!`);
    }

    // Update user role
    await User.findByIdAndUpdate(user._id, { role: newRole });
    
    console.log(`✅ Successfully updated role:`);
    console.log(`   • User: ${user.displayName} (${email})`);
    console.log(`   • Old role: ${oldRole}`);
    console.log(`   • New role: ${newRole}`);

    return true;

  } catch (error) {
    console.error("❌ Role assignment failed:", error);
    return false;
  }
}

async function listAllUsers() {
  try {
    await mongoConnect();
    console.log("📋 All users in the system:\n");

    const users = await User.find({}).sort({ createdAt: 1 });
    
    if (users.length === 0) {
      console.log("   No users found in the database.");
      return;
    }

    users.forEach((user, index) => {
      const role = user.role || 'NOT SET';
      const roleIcon = {
        owner: '👑',
        admin: '🛡️',
        athlete: '🏃',
        official: '🏁'
      }[role as UserRole] || '❓';

      console.log(`   ${index + 1}. ${roleIcon} ${user.displayName}`);
      console.log(`      Email: ${user.email || 'No email'}`);
      console.log(`      Role: ${role.toUpperCase()}`);
      console.log(`      Created: ${user.createdAt?.toISOString().split('T')[0] || 'Unknown'}`);
      console.log('');
    });

    console.log(`📊 Total users: ${users.length}`);

  } catch (error) {
    console.error("❌ Failed to list users:", error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
🎭 User Role Assignment Tool

Usage:
  npm run assign:role -- <email> <role>
  npm run assign:role -- --list

Examples:
  npm run assign:role -- user@example.com admin
  npm run assign:role -- official@example.com official
  npm run assign:role -- --list

Available Roles:
  • owner    - Full access to everything
  • admin    - Full access (same as owner)
  • athlete  - Can view events, register for events
  • official - Can only view events

Options:
  --list, -l    List all users and their current roles
  --help, -h    Show this help message
  `);
  process.exit(0);
}

// Handle list command
if (args[0] === '--list' || args[0] === '-l') {
  listAllUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Handle role assignment
  const email = args[0];
  const role = args[1] as UserRole;

  if (!email || !role) {
    console.error('❌ Please provide both email and role. Use --help for usage information.');
    process.exit(1);
  }

  assignUserRole(email, role)
    .then((success) => {
      if (success) {
        console.log('\n🎉 Role assignment completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Role assignment failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}