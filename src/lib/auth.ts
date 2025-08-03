import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { mongoConnect } from "./mongodb";
import User from "./models/User";

// Environment variables for Google OAuth and JWT
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "fc1f03524255e0e97562d10b8197747a4fb05a5fb83ab51141bb3e32f7b64d66b7a592578b4f9cd0a60e9938cbbc9a4b0c210be16d707a70b018e9f48ad9d769";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// TypeScript interfaces for type safety
export interface User {
  id: string; // Unique user ID in our database
  googleId: string; // Google's unique identifier for the user
  displayName: string; // User's display name from Google
  email?: string; // User's email (optional)
  picture?: string; // User's profile picture URL (optional)
}

export interface Session {
  user: User; // User information
  expires: string; // Session expiration timestamp
}

/**
 * Creates a JWT token containing user information
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
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
  const token = cookieStore.get("auth-token")?.value;

  // Debug logging (remove in production)
  console.log("Auth check - Token exists:", !!token);

  // If no token exists, user is not authenticated
  if (!token) {
    console.log("No auth token found");
    return null;
  }

  // Verify the JWT token
  const decoded = verifyToken(token);
  console.log("Token verification result:", decoded ? "Valid" : "Invalid");

  if (!decoded) {
    console.log("Token is invalid or expired");
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

  console.log("Session created for user:", session.user.displayName);
  return session;
}

/**
 * Signs out the user by clearing the authentication cookie
 * and redirecting to the sign-in page
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token"); // Remove the auth cookie
  redirect("/sign-in"); // Redirect to sign-in page
}

/**
 * Generates the Google OAuth authorization URL
 * This URL will redirect users to Google's consent screen
 * @returns Google OAuth authorization URL
 */
export function getGoogleAuthUrl(): string {
  // The URL where Google will redirect after authorization
  const redirectUri = `${
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/api/auth/google/callback`;

  // Scopes we're requesting from Google
  const scope = "email profile";

  // Build the Google OAuth URL with all required parameters
  return (
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` + // Your Google app ID
    `redirect_uri=${encodeURIComponent(redirectUri)}&` + // Where to redirect after auth
    `response_type=code&` + // We want an authorization code
    `scope=${encodeURIComponent(scope)}&` + // What permissions we need
    `access_type=offline&` + // Get refresh token
    `prompt=consent`
  ); // Always show consent screen
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
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code, // The authorization code from Google
      grant_type: "authorization_code",
      redirect_uri: `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/auth/google/callback`,
    }),
  });

  const tokens = await tokenResponse.json();

  // Check if we got the access token successfully
  if (!tokens.access_token) {
    throw new Error("Failed to get access token");
  }

  // Step 2: Get user information from Google using the access token
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

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
  try {
    await mongoConnect();
    
    // Try to find existing user by Google ID first
    let existingUser = await User.findOne({ googleId: googleUser.googleId });
    
    if (existingUser) {
      console.log('Found existing user by Google ID:', existingUser.displayName);
      return {
        id: existingUser._id.toString(),
        googleId: existingUser.googleId,
        displayName: existingUser.displayName,
        email: existingUser.email,
        picture: existingUser.picture,
      };
    }

    // If no user found by Google ID, check if user exists by email
    if (googleUser.email) {
      existingUser = await User.findOne({ email: googleUser.email });
      
      if (existingUser) {
        console.log('Found existing user by email, updating with Google ID:', existingUser.displayName);
        // Update existing user with Google ID and ensure required fields are set
        existingUser.googleId = googleUser.googleId;
        existingUser.displayName = existingUser.displayName || googleUser.displayName; // Use Google name if current is empty
        existingUser.picture = googleUser.picture || existingUser.picture;
        
        console.log('Updating user with displayName:', existingUser.displayName);
        await existingUser.save();
        
        return {
          id: existingUser._id.toString(),
          googleId: existingUser.googleId,
          displayName: existingUser.displayName,
          email: existingUser.email,
          picture: existingUser.picture,
        };
      }
    }

    // Create new user if not found
    console.log('Creating new user:', googleUser.displayName);
    const newUser = await User.create({
      googleId: googleUser.googleId,
      displayName: googleUser.displayName,
      email: googleUser.email,
      picture: googleUser.picture,
    });

    return {
      id: newUser._id.toString(),
      googleId: newUser.googleId,
      displayName: newUser.displayName,
      email: newUser.email,
      picture: newUser.picture,
    };
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw new Error('Database error during user creation/lookup');
  }
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
  cookieStore.set("auth-token", token, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Signs in a user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns User object if successful
 */
export async function signInWithCredentials(email: string, password: string): Promise<User> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user by email
  console.log('Looking for user with email:', email);
  const user = await getUserByEmail(email);
  console.log('User lookup result:', user ? 'Found' : 'Not found');
  
  if (!user) {
    console.log('No user found with email:', email);
    throw new Error('Invalid credentials');
  }

  // Verify password
  console.log('=== PASSWORD DEBUG INFO ===');
  console.log('User email:', user.email);
  console.log('User displayName:', user.displayName);
  console.log('Plain password provided:', !!password);
  console.log('Plain password length:', password ? password.length : 0);
  console.log('Plain password (first 3 chars):', password ? password.substring(0, 3) + '...' : 'null');
  console.log('Hashed password from DB exists:', !!user.password);
  console.log('Hashed password length:', user.password ? user.password.length : 0);
  console.log('Hashed password (first 10 chars):', user.password ? user.password.substring(0, 10) + '...' : 'null');
  console.log('User object keys:', Object.keys(user));
  console.log('=== END PASSWORD DEBUG ===');
  
  if (!password) {
    console.log('ERROR: No password provided');
    throw new Error('Invalid credentials');
  }
  
  if (!user.password) {
    console.log('ERROR: User has no password in database');
    throw new Error('Invalid credentials');
  }
  
  console.log('About to compare passwords...');
  const isValidPassword = await comparePassword(password, user.password);
  console.log('Password comparison result:', isValidPassword);
  
  if (!isValidPassword) {
    console.log('❌ Password comparison failed!');
    console.log('Expected hash:', user.password);
    console.log('Provided password:', password);
    throw new Error('Invalid credentials');
  }

  console.log('✅ Password is valid!');

  // Return user in the correct format
  return {
    id: user._id?.toString() || user.id || 'unknown',
    googleId: user.googleId || '',
    displayName: user.displayName,
    email: user.email,
    picture: user.picture || '',
  };
}

/**
 * Creates a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @param name - User's display name
 * @returns User object
 */
export async function createUserWithCredentials(email: string, password: string, name?: string): Promise<User> {
  try {
    await mongoConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('DUPLICATE_EMAIL');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const newUser = await User.create({
      email,
      displayName: name || email.split('@')[0], // Use email prefix as name if not provided
      password: hashedPassword,
      // googleId and picture are optional for email/password users
    });

    return {
      id: newUser._id.toString(),
      googleId: newUser.googleId || '',
      displayName: newUser.displayName,
      email: newUser.email,
      picture: newUser.picture,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Finds a user by email address
 * @param email - User's email address
 * @returns User object or null
 */
async function getUserByEmail(email: string): Promise<any> {
  console.log('getUserByEmail called with:', email);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoConnect();
    console.log('MongoDB connected, searching for user...');
    
    // TEMPORARY: Check all users in database
    const allUsers = await User.find({});
    console.log('=== ALL USERS IN DATABASE ===');
    console.log('Total users found:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordStart: user.password ? user.password.substring(0, 10) + '...' : 'null'
      });
    });
    console.log('=== END ALL USERS ===');
    
    const user = await User.findOne({ email });
    console.log('Database query result:', user ? `Found user: ${user.email}` : 'No user found');
    
    if (user) {
      console.log('User details:', {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordStart: user.password ? user.password.substring(0, 10) + '...' : 'null'
      });
      return user;
    }
    
    console.log('No user found in database');
    return null;
    
  } catch (error) {
    console.error('Error finding user by email:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Compares a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match
 */
async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  console.log('=== COMPARE PASSWORD DEBUG ===');
  console.log('Plain password:', password);
  console.log('Hashed password:', hashedPassword);
  console.log('Plain password type:', typeof password);
  console.log('Hashed password type:', typeof hashedPassword);
  
  try {
    const result = await bcrypt.compare(password, hashedPassword);
    console.log('bcrypt.compare result:', result);
    return result;
  } catch (error) {
    console.error('Error in bcrypt.compare:', error);
    return false;
  }
}

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
