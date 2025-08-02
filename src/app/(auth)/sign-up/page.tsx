import { auth, createUserWithCredentials, setAuthCookie } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  // If already signed in, send them home
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">beta-comp | sign up</h1>

        <form
          className="space-y-4"
          action={async (formData: FormData) => {
            "use server";

            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;
            const displayName = (formData.get("displayName") as string) || "";

            // Basic server‐side validation
            if (!email || !password || !confirmPassword) {
              throw new Error("Email, password and confirmation are required");
            }
            if (password.length < 8) {
              throw new Error("Password must be at least 8 characters");
            }
            if (password !== confirmPassword) {
              throw new Error("Passwords don’t match");
            }

            // Attempt to create user
            try {
              const user = await createUserWithCredentials(
                email,
                password,
                displayName
              );
              await setAuthCookie(user);
            } catch (err: any) {
              // Re-throw so Next.js will surface the message
              throw new Error(err.message || "Failed to create account");
            }
            
            // On success, redirect home (outside try/catch to avoid catching NEXT_REDIRECT)
            redirect("/");
          }}
        >
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
          />

          <Input
            name="password"
            type="password"
            placeholder="Password (min. 8 chars)"
            required
            autoComplete="new-password"
          />

          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            required
            autoComplete="new-password"
          />

          <Input
            name="displayName"
            type="text"
            placeholder="Display name (optional)"
          />

          <Button className="w-full" type="submit">
            Create Account
          </Button>
        </form>

        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/sign-in">Already have an account? Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
