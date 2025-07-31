import { handleGoogleCallback, setAuthCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Google OAuth Callback Route
 * 
 * This route handles the callback from Google after user authorization
 * Google redirects here with either:
 * - An authorization code (success)
 * - An error parameter (user denied access)
 * 
 * Flow:
 * 1. User authorizes our app on Google's consent screen
 * 2. Google redirects here with an authorization code
 * 3. We exchange the code for an access token
 * 4. We use the access token to get user information
 * 5. We create/find the user in our database
 * 6. We set an authentication cookie
 * 7. We redirect to the home page
 */
export async function GET(request: Request) {
  // Parse the URL to get query parameters
  const { searchParams } = new URL(request.url);
  
  // Get the authorization code from Google (if successful)
  const code = searchParams.get('code');
  
  // Get any error from Google (if user denied access)
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    // User denied access or other OAuth error
    console.error('Google OAuth error:', error);
    redirect('/sign-in?error=access_denied');
  }

  // Handle missing authorization code
  if (!code) {
    // No code provided by Google
    console.error('No authorization code received from Google');
    redirect('/sign-in?error=no_code');
  }

  try {
    console.log('🚀 Processing Google OAuth callback with code:', code?.substring(0, 20) + '...');
    
    // Process the Google OAuth callback
    // This function will:
    // 1. Exchange the authorization code for an access token
    // 2. Use the access token to get user information from Google
    // 3. Find or create the user in our database
    const user = await handleGoogleCallback(code);
    
    console.log('✅ User obtained from Google OAuth:', user.displayName, user.email);
    
    // Set the authentication cookie
    // This creates a JWT token and stores it in an HTTP-only cookie
    console.log('🍪 Setting authentication cookie...');
    await setAuthCookie(user);
    
    console.log('🏠 Redirecting to home page...');
    // Redirect to the home page (user is now authenticated)
    redirect('/');
    
  } catch (error) {
    // Handle any errors during the OAuth process
    console.error('❌ Google OAuth error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    redirect('/sign-in?error=oauth_error');
  }
} 