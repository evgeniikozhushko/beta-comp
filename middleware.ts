import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';

/**
 * Middleware runs in Edge Runtime and protects routes
 * NOTE: We can't use bcrypt or jsonwebtoken here (Edge Runtime limitation)
 * So we use 'jose' for JWT verification and only check token validity, not database
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check authentication by verifying JWT token from cookies
  const token = request.cookies.get('auth-token')?.value;
  const payload = token ? await verifyTokenEdge(token) : null;
  const isAuthenticated = payload !== null;

  // If user is authenticated and tries to access sign-in/sign-up, redirect to dashboard
  if (isAuthenticated && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT authenticated and tries to access protected routes, redirect to sign-in
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const signInUrl = new URL('/sign-in', request.url);
    // Add callback URL so we can redirect back after login
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = [
    '/dashboard',
    '/events',
    '/profile',
    '/settings',
    '/admin',
  ];

  return protectedPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Configure which routes the middleware runs on
 * Exclude: API routes, static files, images
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
