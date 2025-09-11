import Link from "next/link";
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Check if user is authenticated with timeout fallback
  let session = null;
  
  try {
    console.log('🚀 Starting authentication check...');
    console.time('AUTH_CHECK');
    
    // Add timeout to auth check to prevent hanging
    session = await Promise.race([
      auth(),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), 5000)
      )
    ]);
    
    console.timeEnd('AUTH_CHECK');
    console.log('Session check:', session ? 'Authenticated' : 'Not authenticated');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    console.timeEnd('AUTH_CHECK');
    
    // If auth fails, show welcome page for unauthenticated users
    console.log('Auth error, showing welcome page');
  }
  
  // If user is authenticated, redirect to dashboard
  if (session) {
    console.log('User authenticated, redirecting to dashboard:', session.user.displayName);
    redirect("/dashboard");
  }

  // Show welcome page for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">beta comp</h1>
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-32">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-700 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Competition Management
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-400 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Streamline your competition events, manage athletes, and track results all in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>

            {/* Features Section */}
            <div className="grid gap-8 md:grid-cols-3 mb-2">
              <div className="text-center">
                {/* <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div> */}
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-800 via-purple800 to-blue-800 bg-clip-text text-transparent">Event Management</h3>
                <p className="text-muted-foreground">
                  Create, organize, and manage competition events with ease
                </p>
              </div>

              <div className="text-center">
                {/* <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div> */}
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-700 via-blue-600 to-red-400 bg-clip-text text-transparent">Athlete Tracking</h3>
                <p className="text-muted-foreground">
                  Manage athlete profiles and track their competition history
                </p>
              </div>

              <div className="text-center">
                {/* <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div> */}
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-700 via-pink-600 to-red-400 bg-clip-text text-transparent">Live Results</h3>
                <p className="text-muted-foreground">
                  Real-time scoring and comprehensive analytics dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 beta-comp. Competition management platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}