import { getGoogleAuthUrl } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Google OAuth Initiation Route
 * 
 * This route is called when a user clicks "Continue with Google"
 * It redirects the user to Google's authorization page where they can:
 * - Log in to their Google account
 * - Grant permissions to our application
 * - Be redirected back to our callback URL
 * 
 * Flow:
 * 1. User clicks "Continue with Google" button
 * 2. This route generates Google OAuth URL
 * 3. User is redirected to Google's consent screen
 * 4. After authorization, Google redirects to /api/auth/google/callback
 */
export async function GET() {
  // Generate the Google OAuth authorization URL
  // This URL includes all necessary parameters like client_id, redirect_uri, scope, etc.
  const authUrl = getGoogleAuthUrl();
  
  // Redirect the user to Google's authorization page
  // The user will see Google's login screen and consent form
  redirect(authUrl);
} 