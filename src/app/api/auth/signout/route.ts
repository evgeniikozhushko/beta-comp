import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // Clear the auth token cookie
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  
  // Redirect to sign-in page
  return NextResponse.redirect(new URL("/sign-in", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}

export async function POST() {
  // Handle POST requests the same way
  return GET();
}