import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth";

/**
 * Home Page Component
 * 
 * This is the main page of the application that:
 * 1. Checks if user is authenticated
 * 2. Redirects unauthenticated users to sign-in
 * 3. Displays the main application interface
 * 4. Provides sign-out functionality
 * 
 * Authentication Flow:
 * - If user is not logged in → redirect to /sign-in
 * - If user is logged in → show the main page
 */
export default async function Home() {
  // Check if user is authenticated
  const session = await auth();
  
  // Debug logging (remove this in production)
  console.log('Session check:', session ? 'Authenticated' : 'Not authenticated');
  
  // If user is not authenticated, redirect to sign-in page
  if (!session) {
    console.log('Redirecting to sign-in page');
    redirect("/sign-in");
  }

  console.log('User authenticated:', session.user.displayName);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Application Logo/Title */}
        <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
          beta comp
        </code>
        
        {/* Welcome Message */}
        <div className="text-center">
          <p className="text-lg">Welcome, {session.user.displayName}!</p>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        
        {/* Feature List */}
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          {/* Event Management Link */}
          <li className="mb-2 tracking-[-.01em]">
            {" "}
            <Link href="/events">
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
                Event management
              </code>
            </Link>
          </li>

          {/* Athlete Database */}
          <li className="mb-2 tracking-[-.01em]">
            {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              Athlete database
            </code>
          </li>

          {/* Live Scoring */}
          <li className="mb-2 tracking-[-.01em]">
            {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              Live scoring
            </code>
          </li>

          {/* Custom Features */}
          <li className="tracking-[-.01em]">
            {" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              Custom
            </code>
          </li>
        </ol>

        {/* Action Buttons */}
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          {/* Start Now Button */}
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="#"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Start now
          </a>
          
          {/* About Button */}
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="/about"
            rel="noopener noreferrer"
          >
            About BC
          </a>
          
          {/* Sign Out Button */}
          {/* This form submits to a server action that clears the auth cookie */}
          <form action={async () => {
            "use server"; // This makes the function run on the server
            await signOut(); // Clear auth cookie and redirect to sign-in
          }}>
            <button
              type="submit"
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* Learn Link */}
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        
        {/* Examples Link */}
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        
        {/* Next.js Link */}
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
