/**
 * Edge Runtime compatible auth utilities
 * Uses 'jose' library instead of 'jsonwebtoken' for Edge Runtime compatibility
 */
import { jwtVerify } from 'jose';

// Define UserRole inline to avoid importing from files with Node.js dependencies
type UserRole = 'owner' | 'admin' | 'athlete' | 'official';

const JWT_SECRET = process.env.JWT_SECRET ||
  "fc1f03524255e0e97562d10b8197747a4fb05a5fb83ab51141bb3e32f7b64d66b7a592578b4f9cd0a60e9938cbbc9a4b0c210be16d707a70b018e9f48ad9d769";

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

/**
 * Verifies a JWT token in Edge Runtime
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null; // Token is invalid or expired
  }
}
