import { auth, signInWithCredentials, setAuthCookie } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * Sign-In Page Component
 * 
 * This page handles user authentication with multiple options:
 * 1. Google OAuth (primary method)
 * 2. Email/Password (traditional authentication)
 * 
 * Features:
 * - Redirects authenticated users to home page
 * - Google OAuth button with proper styling
 * - Email/password form with actual authentication
 * - Link to sign-up page
 */
const Page = async () => {
  // Check if user is already authenticated
  const session = await auth();
  
  // If user is already logged in, redirect to home page
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center mb-6">beta-comp | sign in</h1>

        {/* Google OAuth Button */}
        {/* This button redirects to our Google OAuth initiation route */}
        <Button 
          className="w-full" 
          variant="outline"
          asChild
        >
          <Link href="/api/auth/google">
            {/* Google logo SVG */}
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Link>
        </Button>

        {/* Visual separator between authentication methods */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Sign In Form */}
        <form
          className="space-y-4"
          action={async (formData) => {
            "use server";
            
            console.log("🚀 MAIN FORM SERVER ACTION EXECUTING!");
            console.log("📧 Email:", formData.get('email'));
            console.log("🔑 Password provided:", !!formData.get('password'));
            
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            if (!email || !password) {
              console.log("❌ Missing email or password");
              throw new Error('Email and password are required');
            }

            try {
              console.log("🔍 Attempting to authenticate user...");
              const user = await signInWithCredentials(email, password);
              
              console.log("✅ User authenticated:", user.displayName);
              await setAuthCookie(user);
              console.log("🍪 Cookie set, redirecting...");
              
              redirect('/');
            } catch (error) {
              console.error("❌ Authentication failed:", error);
              throw error;
            }
          }}
        >
          {/* Email input field */}
          <Input
            name="email"
            placeholder="Email"
            type="email"
            required
            autoComplete="email"
          />
          
          {/* Password input field */}
          <Input
            name="password"
            placeholder="Password"
            type="password"
            required
            autoComplete="current-password"
          />
          
          {/* Submit button */}
          <Button className="w-full" type="submit">
            Sign In
          </Button>
        </form>

        {/* Link to sign-up page */}
        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/sign-up">Don&apos;t have an account? Sign up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page; 