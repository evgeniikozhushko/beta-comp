import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/types/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Calendar, Users, BarChart3, Plus, Settings } from "lucide-react";
import Link from "next/link";
import CreateEventCard from "@/app/dashboard/CreateEventCard";
import EventAccordion from "@/components/EventAccordion";
import { mongoConnect } from "@/lib/mongodb";
import Facility from "@/lib/models/Facility";
import Event from "@/lib/models/Event";
import Registration from "@/lib/models/Registration";
import { Types } from "mongoose";
import { serializeMongooseArray, SerializedEvent } from "@/lib/utils/serialize";

/**
 * DashboardPage Component
 * 
 * Enhanced to include facilities data fetching for the CreateEventSheet.
 * The Create Event card now triggers a sheet instead of navigation.
 */
export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    return null
  }

  const canCreateEvents = hasPermission(session.user.role, 'canCreateEvents');
  const canManageUsers = hasPermission(session.user.role, 'canManageUsers');
  const userCanRegister = hasPermission(session.user.role, 'canRegisterForEvents');

  // Fetch facilities, events, and user registrations
  let facilities: { id: string; name: string }[] = [];
  let events: SerializedEvent[] = [];
  let userRegistrations: Record<string, string> = {};
  let isLoading = false;
  let error: string | null = null;

  try {
    await mongoConnect();
    
    // Fetch facilities and events in parallel
    const [rawFacilities, rawEvents] = await Promise.all([
      Facility.find().lean(),
      Event.find()
        .populate("facility")
        .sort({ date: 1 })
        .lean()
    ]);

    // Serialize and format facilities
    const serializedFacilities = serializeMongooseArray(rawFacilities);
    facilities = serializedFacilities.map((f: any) => ({
      id: f._id,
      name: f.city
        ? `${f.name} — ${f.city}, ${f.province}`
        : `${f.name} — ${f.province}`,
    }));

    // Serialize events
    events = serializeMongooseArray<SerializedEvent>(rawEvents);

    // Fetch user registrations
    const userRegs = await Registration.find({
      userId: new Types.ObjectId(session.user.id),
      status: { $in: ['registered', 'waitlisted'] }
    }).lean();

    // Serialize and create registration lookup
    const serializedUserRegs = serializeMongooseArray(userRegs);
    userRegistrations = serializedUserRegs.reduce((acc, reg: any) => {
      acc[reg.eventId] = reg.status;
      return acc;
    }, {} as Record<string, string>);

  } catch (fetchError) {
    console.error("Error fetching dashboard data:", fetchError);
    error = "Failed to load dashboard data. Please try refreshing the page.";
    // Continue with empty data - components will handle gracefully
  }

  return (
    <SidebarInset>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
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
            <h1 className="text-2xl font-bold">Welcome back, {session.user.displayName}</h1>
            <p className="text-muted-foreground">
              Your central hub for managing competitions
            </p>
          </div>
          {/* <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize">
            {session.user.role}
          </Badge> */}
        </div>


        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                Active competitions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(userRegistrations).length}</div>
              <p className="text-xs text-muted-foreground">
                Registered events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => {
                  const eventDate = new Date(e.date);
                  const now = new Date();
                  return eventDate.getMonth() === now.getMonth() && 
                         eventDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Upcoming events
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
                Coming soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Create Event Card - Now triggers sheet instead of navigation */}
          {canCreateEvents && (
            <CreateEventCard facilities={facilities} />
          )}

          {/* View Events Card */}
          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/events">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">View Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Manage competitions
                </p>
              </CardContent>
            </Link>
          </Card> */}

          {/* Prev Quick Actions */}
          {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {canCreateEvents && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/events/create">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">View Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Manage competitions
                </p>
              </CardContent>
            </Link>
          </Card> */}


          {/* Athletes Card */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/athletes">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/athletes">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Athletes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  View athlete profiles
                </p>
              </CardContent>
            </Link>
          </Card> */}


          {/* Statistics Card */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/stats">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/stats">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Statistics</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  View analytics
                </p>
              </CardContent>
            </Link>
          </Card> */}
          {/* User Management Card */}
          {canManageUsers && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/athletes/manage">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

          {/* {canManageUsers && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/athletes/manage">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          )} */}
        </div>


        {/* Overview Stats - Placeholder for Phase 2 */}
        {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        </div> */}

        {/* Events Accordion */}
        <EventAccordion
          events={events}
          facilities={facilities}
          userRegistrations={userRegistrations}
          userCanRegister={userCanRegister}
          userRole={session.user.role}
          userId={session.user.id}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </SidebarInset>
  );
}