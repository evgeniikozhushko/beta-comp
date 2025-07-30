# Google OAuth Setup Guide

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web Application**
6. Add these Authorized Redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Save the **Client ID** and **Client Secret**

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# App URL
NEXTAUTH_URL=http://localhost:3000
```

## 3. Install Dependencies

```bash
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

## 4. Database Integration

Replace the mock `findOrCreateUser` function in `src/lib/auth.ts` with your actual database logic:

```typescript
async function findOrCreateUser(googleUser: {
  googleId: string;
  displayName: string;
  email?: string;
  picture?: string;
}): Promise<User> {
  // Connect to your MongoDB and find/create user
  const existingUser = await User.findOne({ googleId: googleUser.googleId });
  
  if (existingUser) {
    return existingUser;
  }

  const newUser = await User.create({
    googleId: googleUser.googleId,
    displayName: googleUser.displayName,
    email: googleUser.email,
    picture: googleUser.picture,
  });

  return newUser;
}
```

## 5. Test the Integration

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/sign-in`
3. Click "Continue with Google"
4. Complete the OAuth flow

## Features Implemented

- ✅ Google OAuth authentication
- ✅ JWT token management
- ✅ Secure cookie storage
- ✅ Session management
- ✅ Protected routes
- ✅ Sign out functionality
- ✅ TypeScript support

## Security Notes

- JWT tokens are stored in HTTP-only cookies
- Passwords are hashed with bcrypt (if you add email/password auth)
- OAuth tokens are not stored, only user info
- Sessions expire after 7 days 