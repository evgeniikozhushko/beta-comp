import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/types/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from"@/components/ui/breadcrumb";
import { Calendar, Users, BarChart3, Plus, Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    return null
  }

  const canCreateEvents = hasPermission(session.user.role, 'canCreateEvents');
  const canManageUsers = hasPermission(session.user.role, 'canManageUsers');
  const isAdmin = session.user.role === 'owner' || session.user.role === 'admin';

  return (
    <SidebarInset>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {session.user.displayName}</h1>
            <p className="text-muted-foreground">
              Your central hub for managing your competitions
            </p>
          </div>
          {/* <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize">
            {session.user.role}
          </Badge> */}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {canCreateEvents && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/events/create">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 
    pb-2">
                  <CardTitle className="text-sm font-medium">Create Event</CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Set up a new competition
                  </p>
                </CardContent>
              </Link>
            </Card>
          )}

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/events">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 
    pb-2">
                <CardTitle className="text-sm font-medium">View Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Manage competitions
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/athletes">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 
    pb-2">
                <CardTitle className="text-sm font-medium">Athletes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  View athlete profiles
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/stats">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 
    pb-2">
                <CardTitle className="text-sm font-medium">Statistics</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  View analytics
                </p>
              </CardContent>
            </Link>
          </Card>

          {canManageUsers && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/athletes/manage">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 
    pb-2">
                  <CardTitle className="text-sm font-medium">User Management</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Manage user roles
                  </p>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>

        {/* Overview Stats - Placeholder for Phase 2 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Coming in Phase 2
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Coming in Phase 2
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Coming in Phase 2
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Coming in Phase 2
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}