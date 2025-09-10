import { SignOutButton } from "@/components/SignOutButton";
import { MainNavigation } from "@/components/MainNavigation";

interface PageHeaderProps {
  user: {
    displayName: string;
  };
}

export function PageHeader({ user }: PageHeaderProps) {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* App title with responsive text size */}
          <div className="flex items-center">
            <code className="tracking-wide bg-black/[.05] dark:bg-white/[.06] px-2 py-1 rounded text-sm sm:text-md font-[family-name:var(--font-geist-mono)] font-semibold">
              beta comp
            </code>
          </div>

          {/* Navigation - center */}
          <div className="flex-1 flex justify-center">
            <MainNavigation />
          </div>

          {/* User actions with responsive text */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px] lg:max-w-none">
              {user.displayName}
            </span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}