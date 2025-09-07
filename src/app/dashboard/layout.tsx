import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar";

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    // Check Auth
    const session = await auth()

    if (!session) {
        redirect('/sign-in')
    }

    return (
        <div className="dashboard-layout">
            <SidebarProvider>
                <AppSidebar user={session.user} />
                <main className="flex-1">
                    {children}
                </main>
            </SidebarProvider>
        </div>
    );
}

