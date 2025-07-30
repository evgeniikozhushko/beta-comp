import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Environment variables for Google OAuth and JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fc1f03524255e0e97562d10b8197747a4fb05a5fb83ab51141bb3e32f7b64d66b7a592578b4f9cd0a60e9938cbbc9a4b0c210be16d707a70b018e9f48ad9d769';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// TypeScript interfaces for type safety
export interface User {
  id: string;           // Unique user ID in our database
  googleId: string;     // Google's unique identifier for the user
  displayName: string;  // User's display name from Google
  email?: string;       // User's email (optional)
  picture?: string;     // User's profile picture URL (optional)
}

export interface Session {
  user: User;           // User information
  expires: string;      // Session expiration timestamp
}

/**
 * Creates a JWT token containing user information
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Token is invalid or expired
  }
}

/**
 * Gets the current user session from HTTP-only cookies
 * This is the main function used to check if a user is authenticated
 * @returns Session object or null if not authenticated
 */
export async function auth(): Promise<Session | null> {
  // Get cookies from the request
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  // Debug logging (remove in production)
  console.log('Auth check - Token exists:', !!token);
  
  // If no token exists, user is not authenticated
  if (!token) {
    console.log('No auth token found');
    return null;
  }

  // Verify the JWT token
  const decoded = verifyToken(token);
  console.log('Token verification result:', decoded ? 'Valid' : 'Invalid');
  
  if (!decoded) {
    console.log('Token is invalid or expired');
    return null; // Token is invalid or expired
  }

  // Return session with user information
  const session = {
    user: {
      id: decoded.id,
      googleId: decoded.googleId,
      displayName: decoded.displayName,
      email: decoded.email,
      picture: decoded.picture,
    },
    expires: new Date(decoded.exp * 1000).toISOString(),
  };
  
  console.log('Session created for user:', session.user.displayName);
  return session;
}

/**
 * Signs out the user by clearing the authentication cookie
 * and redirecting to the sign-in page
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token'); // Remove the auth cookie
  redirect('/sign-in'); // Redirect to sign-in page
}

/**
 * Generates the Google OAuth authorization URL
 * This URL will redirect users to Google's consent screen
 * @returns Google OAuth authorization URL
 */
export function getGoogleAuthUrl(): string {
  // The URL where Google will redirect after authorization
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;
  
  // Scopes we're requesting from Google
  const scope = 'email profile';
  
  // Build the Google OAuth URL with all required parameters
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +                    // Your Google app ID
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +   // Where to redirect after auth
    `response_type=code&` +                               // We want an authorization code
    `scope=${encodeURIComponent(scope)}&` +               // What permissions we need
    `access_type=offline&` +                              // Get refresh token
    `prompt=consent`;                                     // Always show consent screen
}

/**
 * Handles the Google OAuth callback process
 * 1. Exchanges authorization code for access token
 * 2. Gets user information from Google
 * 3. Creates or finds user in our database
 * @param code - Authorization code from Google
 * @returns User object
 */
export async function handleGoogleCallback(code: string): Promise<User> {
  // Step 1: Exchange authorization code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code, // The authorization code from Google
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    }),
  });

  const tokens = await tokenResponse.json();
  
  // Check if we got the access token successfully
  if (!tokens.access_token) {
    throw new Error('Failed to get access token');
  }

  // Step 2: Get user information from Google using the access token
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  const googleUser = await userResponse.json();

  // Step 3: Find or create user in our database
  const user = await findOrCreateUser({
    googleId: googleUser.id,
    displayName: googleUser.name,
    email: googleUser.email,
    picture: googleUser.picture,
  });

  return user;
}

/**
 * Finds an existing user or creates a new one in the database
 * This is where you'd integrate with your MongoDB/PostgreSQL/etc.
 * @param googleUser - User information from Google
 * @returns User object
 */
async function findOrCreateUser(googleUser: {
  googleId: string;
  displayName: string;
  email?: string;
  picture?: string;
}): Promise<User> {
  // TODO: Replace this mock implementation with your actual database logic
  // Example MongoDB integration:
  // const existingUser = await User.findOne({ googleId: googleUser.googleId });
  // if (existingUser) return existingUser;
  // 
  // const newUser = await User.create({
  //   googleId: googleUser.googleId,
  //   displayName: googleUser.displayName,
  //   email: googleUser.email,
  //   picture: googleUser.picture,
  // });
  // return newUser;

  // Mock implementation for demo purposes
  const user: User = {
    id: Date.now().toString(),
    googleId: googleUser.googleId,
    displayName: googleUser.displayName,
    email: googleUser.email,
    picture: googleUser.picture,
  };

  return user;
}

/**
 * Sets the authentication cookie with user information
 * This creates a JWT token and stores it in an HTTP-only cookie
 * @param user - User object to store in the session
 */
export async function setAuthCookie(user: User): Promise<void> {
  // Create JWT token with user information
  const token = createToken({
    id: user.id,
    googleId: user.googleId,
    displayName: user.displayName,
    email: user.email,
    picture: user.picture,
  });

  // Set HTTP-only cookie (secure, can't be accessed by JavaScript)
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,                    // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',                   // CSRF protection
    maxAge: 7 * 24 * 60 * 60,         // 7 days
  });
} 