// import Link from "next/link";
// import { redirect } from "next/navigation"
// import { auth } from "@/lib/auth";
// import { PageHeader } from "@/components/PageHeader";

// export default async function Home() {
  // Check if user is authenticated with timeout fallback
//   let session = null;
  
//   try {
//     console.log('🚀 Starting authentication check...');
//     console.time('AUTH_CHECK');
    
    // Add timeout to auth check to prevent hanging
//     session = await Promise.race([
//       auth(),
//       new Promise<null>((_, reject) => 
//         setTimeout(() => reject(new Error('Authentication timeout')), 5000)
//       )
//     ]);
    
//     console.timeEnd('AUTH_CHECK');
//     console.log('Session check:', session ? 'Authenticated' : 'Not authenticated');
//   } catch (error) {
//     console.error('❌ Authentication failed:', error);
//     console.timeEnd('AUTH_CHECK');
    
    // If auth fails, redirect to sign-in page
//     console.log('Redirecting to sign-in due to auth error');
//     redirect("/sign-in");
//   }
  
  // If user is not authenticated, redirect to sign-in page
//   if (!session) {
//     console.log('Redirecting to sign-in page - no session');
//     redirect("/sign-in");
//   }

//   console.log('User authenticated:', session.user.displayName);

//   return (
//     <div>
      {/* Header */}
    //   <PageHeader user={session.user} />
      
    //   <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    //     <div className="max-w-4xl mx-auto">

        {/* Welcome Section */}
        // <div className="text-start mb-12">
        //   <h1 className="text-md font-bold">
        //     Welcome, {session.user.displayName}!
        //   </h1>
        //   <p className="text-sm text-muted-foreground">
        //     {session.user.email}
        //   </p>
        // </div>

        {/* Feature Grid */}
        // <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Event Management */}
        //   <Link href="/events" className="group">
        //     <div className="border rounded-lg p-6 hover:shadow-lg transition-all group-hover:border-primary">
        //       <div className="mb-4">
        //         <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
        //         1
        //         </div>
        //         <h2 className="text-md font-semibold mb-2">Events</h2>
        //         <p className="text-sm text-muted-foreground">
        //           Create, manage, and track competition events
        //         </p>
        //       </div>
        //     </div>
        //   </Link>

          {/* Athlete Database */}
        //   <div className="border rounded-lg p-6 hover:shadow-lg transition-all opacity-50">
        //     <div className="mb-4">
        //       <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
        //         2
        //       </div>
        //       <h2 className="text-md font-semibold mb-2">Athletes</h2>
        //       <p className="text-sm text-muted-foreground">
        //         Manage athlete profiles and information
        //       </p>
        //       <p className="text-xs text-muted-foreground mt-2">Coming Soon</p>
        //     </div>
        //   </div>

          {/* Live Scoring */}
        //   <div className="border rounded-lg p-6 hover:shadow-lg transition-all opacity-50">
        //     <div className="mb-4">
        //       <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
        //         3
        //       </div>
        //       <h2 className="text-md font-semibold mb-2">Stats</h2>
        //       <p className="text-sm text-muted-foreground">
        //         Real-time competition scoring, results and statistics
        //       </p>
        //       <p className="text-xs text-muted-foreground mt-2">Coming Soon</p>
        //     </div>
        //   </div>
        // </div>

        {/* Quick Actions */}
        {/* <div className="text-center">
          <Link 
            href="/events"
            className="inline-flex items-center justify-center rounded-md bg-primary 
text-primary-foreground hover:bg-primary/90 h-10 px-8 font-medium transition-colors"
          >
            Get Started
          </Link>
        </div> */}
//         </div>
//       </div>
//     </div>
//   );
// }