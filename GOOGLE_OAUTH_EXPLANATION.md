# Google OAuth Implementation - Detailed Explanation

## 🏗️ **Architecture Overview**

This implementation adapts Google OAuth for Next.js App Router, replacing the traditional Express.js + Passport.js approach with a more modern, integrated solution.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User clicks   │    │   Google OAuth  │    │   Next.js API   │
│ "Continue with  │───▶│   Authorization │───▶│     Routes      │
│    Google"      │    │      Flow       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   JWT Token     │    │   HTTP-only     │
                       │   Creation      │    │    Cookies      │
                       └─────────────────┘    └─────────────────┘
```

## 📁 **File Structure & Purpose**

### 1. **`src/lib/auth.ts`** - Core Authentication Logic

This is the heart of the authentication system. It contains:

#### **Type Definitions**
```typescript
export interface User {
  id: string;           // Our database ID
  googleId: string;     // Google's unique ID
  displayName: string;  // User's name from Google
  email?: string;       // User's email
  picture?: string;     // Profile picture URL
}
```

#### **JWT Token Management**
```typescript
// Creates JWT tokens with user data
export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verifies and decodes JWT tokens
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Invalid or expired token
  }
}
```

#### **Session Management**
```typescript
// Main function to check if user is authenticated
export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  return { user: decoded, expires: new Date(decoded.exp * 1000).toISOString() };
}
```

#### **Google OAuth URL Generation**
```typescript
export function getGoogleAuthUrl(): string {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;
  const scope = 'email profile';
  
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;
}
```

### 2. **`src/app/api/auth/google/route.ts`** - OAuth Initiation

This route starts the OAuth flow:

```typescript
export async function GET() {
  const authUrl = getGoogleAuthUrl();  // Generate Google OAuth URL
  redirect(authUrl);                   // Redirect user to Google
}
```

**Flow:**
1. User clicks "Continue with Google"
2. This route generates the Google OAuth URL
3. User is redirected to Google's consent screen

### 3. **`src/app/api/auth/google/callback/route.ts`** - OAuth Callback

This route handles the OAuth callback from Google:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');      // Authorization code
  const error = searchParams.get('error');    // Any OAuth errors
  
  if (error) redirect('/sign-in?error=access_denied');
  if (!code) redirect('/sign-in?error=no_code');
  
  try {
    const user = await handleGoogleCallback(code);  // Process OAuth
    await setAuthCookie(user);                      // Set auth cookie
    redirect('/');                                  // Go to home page
  } catch (error) {
    redirect('/sign-in?error=oauth_error');
  }
}
```

**Flow:**
1. Google redirects here with authorization code
2. Exchange code for access token
3. Get user info from Google
4. Create/find user in database
5. Set authentication cookie
6. Redirect to home page

### 4. **`src/app/(auth)/sign-in/page.tsx`** - User Interface

The sign-in page with Google OAuth button:

```typescript
const Page = async () => {
  const session = await auth();           // Check if already logged in
  if (session) redirect("/");            // Redirect if authenticated
  
  return (
    <div>
      {/* Google OAuth Button */}
      <Button asChild>
        <Link href="/api/auth/google">
          <svg>...</svg>  {/* Google logo */}
          Continue with Google
        </Link>
      </Button>
      
      {/* Email/Password Form (placeholder) */}
      <form action={async (formData) => {
        "use server";
        redirect('/api/auth/google');  // Currently redirects to Google OAuth
      }}>
        {/* Form fields */}
      </form>
    </div>
  );
};
```

### 5. **`src/app/page.tsx`** - Protected Home Page

The main page with authentication protection:

```typescript
export default async function Home() {
  const session = await auth();           // Check authentication
  if (!session) redirect("/sign-in");    // Redirect if not logged in
  
  return (
    <div>
      {/* Main app content */}
      
      {/* Sign Out Button */}
      <form action={async () => {
        "use server";
        await signOut();  // Clear auth cookie and redirect
      }}>
        <button type="submit">Sign Out</button>
      </form>
    </div>
  );
}
```

## 🔄 **Complete OAuth Flow**

```
1. User clicks "Continue with Google"
   ↓
2. /api/auth/google route generates OAuth URL
   ↓
3. User redirected to Google's consent screen
   ↓
4. User authorizes the application
   ↓
5. Google redirects to /api/auth/google/callback with code
   ↓
6. Callback route exchanges code for access token
   ↓
7. Access token used to get user info from Google
   ↓
8. User created/found in database
   ↓
9. JWT token created and stored in HTTP-only cookie
   ↓
10. User redirected to home page (authenticated)
```

## 🔐 **Security Features**

### **JWT Token Security**
- **Expiration**: 7 days
- **HTTP-only cookies**: Prevents XSS attacks
- **Secure flag**: HTTPS only in production
- **SameSite**: CSRF protection

### **OAuth Security**
- **No token storage**: We don't store Google access tokens
- **User info only**: We only store user profile information
- **Secure redirects**: All redirects are validated

### **Database Integration**
```typescript
// TODO: Replace with your actual database logic
async function findOrCreateUser(googleUser) {
  // Example MongoDB integration:
  const existingUser = await User.findOne({ googleId: googleUser.googleId });
  if (existingUser) return existingUser;
  
  const newUser = await User.create({
    googleId: googleUser.googleId,
    displayName: googleUser.displayName,
    email: googleUser.email,
    picture: googleUser.picture,
  });
  
  return newUser;
}
```

## 🚀 **Key Advantages Over Traditional Approach**

| Traditional (Express + Passport) | Our Implementation |
|----------------------------------|-------------------|
| Separate backend server | Everything in Next.js |
| Session-based auth | JWT token auth |
| Complex setup | Simple setup |
| Multiple dependencies | Minimal dependencies |
| Harder deployment | Easy deployment |

## 📝 **Environment Variables Required**

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# App URL
NEXTAUTH_URL=http://localhost:3000
```

## 🎯 **Next Steps**

1. **Set up Google OAuth credentials** (follow setup guide)
2. **Install TypeScript types**: `npm install --save-dev @types/bcrypt @types/jsonwebtoken`
3. **Integrate with your database** (replace mock `findOrCreateUser`)
4. **Add email/password authentication** (optional)
5. **Customize user interface** to match your app's design

This implementation provides a modern, secure, and scalable authentication system that's perfectly suited for Next.js applications. 