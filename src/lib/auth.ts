import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { mongoConnect } from "./mongodb";
import User from "./models/User";
import { UserRole } from "./types/permissions";

// Environment variables for Google OAuth and JWT
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "fc1f03524255e0e97562d10b8197747a4fb05a5fb83ab51141bb3e32f7b64d66b7a592578b4f9cd0a60e9938cbbc9a4b0c210be16d707a70b018e9f48ad9d769";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// TypeScript interfaces for type safety
export interface User {
  id: string; // Unique user ID in our database
  googleId?: string; // Google's unique identifier for the user (optional for email/password users)
  displayName: string; // User's display name from Google
  email?: string; // User's email (optional)
  picture?: string; // User's profile picture URL (optional)
  role: UserRole; // User's role for permissions
}

export interface Session {
  user: User; // User information
  expires: string; // Session expiration timestamp
}

interface JWTPayload {
  id: string;
  googleId?: string;
  displayName: string;
  email?: string;
  picture?: string;
  role: UserRole;
  exp: number;
  iat: number;
}

interface DatabaseUser {
  _id?: string;
  id?: string;
  googleId?: string;
  displayName: string;
  email?: string;
  picture?: string;
  password?: string;
  role: UserRole;
}

/**
 * Creates a JWT token containing user information
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export function createToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const result = jwt.verify(token, JWT_SECRET);
    return typeof result === 'string' ? null : result as JWTPayload;
  } catch {
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

  // Ensure user still exists in database
  try {
    await mongoConnect();
    const userInDb = await User.findById(decoded.id);
    
    if (!userInDb) {
      console.warn("🚨 User in JWT token doesn't exist in database:", {
        tokenUserId: decoded.id,
        userEmail: decoded.email,
        displayName: decoded.displayName
      });
      
      // Try to recreate the user if we have enough information
      if (decoded.email && decoded.displayName) {
        console.log("🔧 Attempting to recreate missing user in database...");
        try {
          const recreatedUser = await User.create({
            _id: decoded.id, // Use the same ID from the JWT
            googleId: decoded.googleId,
            displayName: decoded.displayName,
            email: decoded.email,
            picture: decoded.picture,
            role: decoded.role,
          });
          console.log("✅ Successfully recreated user in database:", recreatedUser.displayName);
        } catch (recreateError) {
          console.error("❌ Failed to recreate user in database:", recreateError);
          // Return null to force re-authentication
          return null;
        }
      } else {
        console.log("❌ Cannot recreate user - insufficient information in JWT");
        return null;
      }
    } else {
      // User exists in database, check if their info is up to date
      let needsUpdate = false;
      const updates: any = {};
      
      if (decoded.displayName && userInDb.displayName !== decoded.displayName) {
        updates.displayName = decoded.displayName;
        needsUpdate = true;
      }
      if (decoded.email && userInDb.email !== decoded.email) {
        updates.email = decoded.email;
        needsUpdate = true;
      }
      if (decoded.picture && userInDb.picture !== decoded.picture) {
        updates.picture = decoded.picture;
        needsUpdate = true;
      }
      if (decoded.role && userInDb.role !== decoded.role) {
        updates.role = decoded.role;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log("🔄 Updating user in database with JWT info:", updates);
        await User.findByIdAndUpdate(decoded.id, updates);
      }
    }
  } catch (dbError) {
    console.error("❌ Database error during auth check:", dbError);
    // Continue with session even if database check fails
  }

  // Return session with user information
  const session = {
    user: {
      id: decoded.id,
      googleId: decoded.googleId,
      displayName: decoded.displayName,
      email: decoded.email,
      picture: decoded.picture,
      role: decoded.role,
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
  // Determine the app URL based on environment
  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://beta-comp.onrender.com"
      : "http://localhost:3000");

  // The URL where Google will redirect after authorization
  const redirectUri = `${appUrl}/api/auth/google/callback`;

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
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NODE_ENV === "production"
          ? "https://beta-comp.onrender.com"
          : "http://localhost:3000")
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
    console.log('🔍 Looking for user with Google ID:', googleUser.googleId, 'and email:', googleUser.email);
    
    // Try to find existing user by Google ID first
    let existingUser = await User.findOne({ googleId: googleUser.googleId });
    
    if (existingUser) {
      console.log('✅ Found existing user by Google ID:', existingUser.displayName);
      
      // Update user info from Google if needed
      let needsUpdate = false;
      if (googleUser.displayName && existingUser.displayName !== googleUser.displayName) {
        existingUser.displayName = googleUser.displayName;
        needsUpdate = true;
      }
      if (googleUser.email && existingUser.email !== googleUser.email) {
        existingUser.email = googleUser.email;
        needsUpdate = true;
      }
      if (googleUser.picture && existingUser.picture !== googleUser.picture) {
        existingUser.picture = googleUser.picture;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log('🔄 Updating existing user with latest Google info');
        await existingUser.save();
      }
      
      return {
        id: existingUser._id.toString(),
        googleId: existingUser.googleId,
        displayName: existingUser.displayName,
        email: existingUser.email,
        picture: existingUser.picture,
        role: existingUser.role,
      };
    }

    // If no user found by Google ID, check if user exists by email
    if (googleUser.email) {
      console.log('🔍 No user found by Google ID, checking by email:', googleUser.email);
      existingUser = await User.findOne({ email: googleUser.email });
      
      if (existingUser) {
        console.log('✅ Found existing user by email, linking with Google ID:', existingUser.displayName);
        
        // Update existing user with Google ID and ensure required fields are set
        existingUser.googleId = googleUser.googleId;
        existingUser.displayName = existingUser.displayName || googleUser.displayName;
        existingUser.picture = googleUser.picture || existingUser.picture;
        
        console.log('🔄 Updating user with Google integration:', existingUser.displayName);
        await existingUser.save();
        
        return {
          id: existingUser._id.toString(),
          googleId: existingUser.googleId,
          displayName: existingUser.displayName,
          email: existingUser.email,
          picture: existingUser.picture,
          role: existingUser.role,
        };
      }
    }

    // Create new user if not found
    console.log('➕ Creating new user:', googleUser.displayName, 'with email:', googleUser.email);
    
    // Check if this is the owner email and assign owner role
    const role: UserRole = googleUser.email === 'evgeniimedium@gmail.com' ? 'owner' : 'athlete';
    console.log('👤 Assigning role:', role, 'to new user:', googleUser.email);
    
    const userData = {
      googleId: googleUser.googleId,
      displayName: googleUser.displayName,
      email: googleUser.email,
      picture: googleUser.picture,
      role: role,
    };
    
    console.log('📝 Creating user with data:', userData);
    const newUser = await User.create(userData);
    
    console.log('✅ Successfully created new user:', newUser._id.toString(), newUser.displayName);

    return {
      id: newUser._id.toString(),
      googleId: newUser.googleId,
      displayName: newUser.displayName,
      email: newUser.email,
      picture: newUser.picture,
      role: newUser.role,
    };
  } catch (error) {
    console.error('❌ Error in findOrCreateUser:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      googleUser: googleUser
    });
    throw new Error(`Database error during user creation/lookup: ${error instanceof Error ? error.message : String(error)}`);
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
    role: user.role,
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
    throw new Error('MISSING_FIELDS');
  }

  // Find user by email
  console.log('Looking for user with email:', email);
  const user = await getUserByEmail(email);
  console.log('User lookup result:', user ? 'Found' : 'Not found');
  
  if (!user) {
    console.log('No user found with email:', email);
    throw new Error('INVALID_CREDENTIALS');
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
    throw new Error('INVALID_CREDENTIALS');
  }
  
  if (!user.password) {
    console.log('ERROR: User has no password in database');
    throw new Error('INVALID_CREDENTIALS');
  }
  
  console.log('About to compare passwords...');
  const isValidPassword = await comparePassword(password, user.password);
  console.log('Password comparison result:', isValidPassword);
  
  if (!isValidPassword) {
    console.log('❌ Password comparison failed!');
    console.log('Expected hash:', user.password);
    console.log('Provided password:', password);
    throw new Error('INVALID_CREDENTIALS');
  }

  console.log('✅ Password is valid!');

  // Return user in the correct format
  return {
    id: user._id?.toString() || user.id || 'unknown',
    googleId: user.googleId || '',
    displayName: user.displayName,
    email: user.email,
    picture: user.picture || '',
    role: user.role,
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
    
    // Check if this is the owner email and assign owner role
    const role: UserRole = email === 'evgeniimedium@gmail.com' ? 'owner' : 'athlete';
    console.log('Creating user with role:', role, 'for email:', email);
    
    // Create new user
    const newUser = await User.create({
      email,
      displayName: name || email.split('@')[0], // Use email prefix as name if not provided
      password: hashedPassword,
      role: role,
      // googleId and picture are optional for email/password users
    });

    return {
      id: newUser._id.toString(),
      googleId: newUser.googleId || '',
      displayName: newUser.displayName,
      email: newUser.email,
      picture: newUser.picture,
      role: newUser.role,
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
async function getUserByEmail(email: string): Promise<DatabaseUser | null> {
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
