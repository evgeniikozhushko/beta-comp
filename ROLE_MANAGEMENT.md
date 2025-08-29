# Role Management System

## Overview

The role-based permission system allows you to control user access levels across the application. There are 4 roles available:

- **Owner** 👑 - Full access to everything
- **Admin** 🛡️ - Full access (same as owner) 
- **Athlete** 🏃 - Can view events, register for events
- **Official** 🏁 - Can only view events

## How to Assign Roles

### Method 1: Command Line Script (Recommended)

#### List all users and their current roles:
```bash
npm run assign:role -- --list
```

#### Assign a role to a user:
```bash
# Make someone an admin
npm run assign:role -- user@example.com admin

# Make someone an official
npm run assign:role -- referee@example.com official

# Make someone an athlete (default role)
npm run assign:role -- athlete@example.com athlete
```

#### Get help:
```bash
npm run assign:role -- --help
```

### Method 2: Admin API Endpoints

#### List all users (Admin/Owner only):
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  "http://localhost:3000/api/admin/users"
```

#### Get specific user details:
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  "http://localhost:3000/api/admin/users/<user-id>/role"
```

#### Change user role:
```bash
curl -X PATCH \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}' \
  "http://localhost:3000/api/admin/users/<user-id>/role"
```

### Method 3: Initial Migration (One-time)

For existing users without roles:
```bash
npm run migrate:roles
```

This will:
- Set `evgeniimedium@gmail.com` as **owner**
- Set all other existing users as **athlete**

## Permission Matrix

| Feature | Owner | Admin | Athlete | Official |
|---------|-------|-------|---------|----------|
| View Events | ✅ | ✅ | ✅ | ✅ |
| Create Events | ✅ | ✅ | ❌ | ❌ |
| Edit Own Events | ✅ | ✅ | ❌ | ❌ |
| Delete Own Events | ✅ | ✅ | ❌ | ❌ |
| Edit Any Event | ✅ | ✅ | ❌ | ❌ |
| Delete Any Event | ✅ | ✅ | ❌ | ❌ |
| Register for Events | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |

## Automatic Role Assignment

New users are automatically assigned roles based on:

1. **Owner Role**: `evgeniimedium@gmail.com` automatically gets `owner` role
2. **Default Role**: All other new users get `athlete` role

## Security Notes

- Only **Owner** and **Admin** roles can access the admin APIs
- Only **Owner** can assign/remove the `owner` role
- Users cannot change their own role
- All role changes are logged in the server console
- Permissions are enforced on both client and server side

## Testing the System

1. Sign in with different user accounts
2. Check the "User Info" section on the events page to see your role
3. Notice how the UI changes based on your role:
   - Create Event button only shows for Owner/Admin
   - Edit/Delete buttons only show when you have permission
4. Try accessing admin APIs with different role levels

## Troubleshooting

**Problem**: User shows "Role not set" 
**Solution**: The user needs to sign out and sign back in, or run the migration script

**Problem**: Can't access admin APIs
**Solution**: Make sure you're signed in as Owner or Admin, and include the auth token

**Problem**: Permission denied errors
**Solution**: Check that the user has the correct role for the action they're trying to perform