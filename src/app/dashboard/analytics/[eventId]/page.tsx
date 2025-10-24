"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  UserX,
  Clock,
  Download,
  TrendingUp
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Participant {
  userId: string;
  displayName: string;
  email: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
  registeredAt: string;
  cancelledAt?: string;
}

interface AnalyticsData {
  eventId: string;
  eventName: string;
  eventDate: string;
  summary: {
    totalRegistered: number;
    totalWaitlisted: number;
    totalCancelled: number;
    currentCapacity: number;
    maxCapacity: number;
  };
  participants: Participant[];
  timeline: {
    date: string;
    registered: number;
    cancelled: number;
  }[];
}

export default function EventAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${eventId}/analytics`);

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (eventId) {
      fetchAnalytics();
    }
  }, [eventId]);

  // Filter and sort participants
  const filteredParticipants = analytics?.participants
    .filter(p => {
      const matchesSearch =
        p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.displayName.localeCompare(b.displayName);
      } else if (sortBy === "date") {
        return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    }) || [];

  // Export to CSV function
  const exportToCSV = () => {
    if (!analytics) return;

    const headers = ["Name", "Email", "Status", "Registered At", "Cancelled At"];
    const rows = filteredParticipants.map(p => [
      p.displayName,
      p.email,
      p.status,
      new Date(p.registeredAt).toLocaleString(),
      p.cancelledAt ? new Date(p.cancelledAt).toLocaleString() : "N/A"
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analytics.eventName.replace(/\s+/g, "_")}_participants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'registered':
        return 'default';
      case 'waitlisted':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !analytics) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Failed to load analytics"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{analytics.eventName}</h1>
            <p className="text-sm text-muted-foreground">
              Event Analytics - {formatDate(analytics.eventDate)}
            </p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.summary.totalRegistered}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlisted</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.summary.totalWaitlisted}
            </div>
            <p className="text-xs text-muted-foreground">
              On waitlist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.summary.totalCancelled}
            </div>
            <p className="text-xs text-muted-foreground">
              Cancellations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.summary.maxCapacity > 0
                ? `${analytics.summary.currentCapacity}/${analytics.summary.maxCapacity}`
                : analytics.summary.currentCapacity
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.maxCapacity > 0 ? "Used capacity" : "Unlimited"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            Full list of all registrations including cancelled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "date" | "status")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Registration Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered At</TableHead>
                  <TableHead>Cancelled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No participants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipants.map((participant) => (
                    <TableRow key={participant.userId}>
                      <TableCell className="font-medium">
                        {participant.displayName}
                      </TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(participant.status)}>
                          {participant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(participant.registeredAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {participant.cancelledAt
                          ? formatDate(participant.cancelledAt)
                          : "-"
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Result count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredParticipants.length} of {analytics.participants.length} participants
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
