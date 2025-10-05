"use client"

import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { CalendarDays } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, usePathname } from "next/navigation"

export function Calendars() {
  const { state } = useSidebar()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const router = useRouter()
  const pathname = usePathname()

  // Fetch event dates from API
  const { data: eventDatesData } = useQuery({
    queryKey: ['eventDates'],
    queryFn: async () => {
      const response = await fetch('/api/events/dates')
      if (!response.ok) throw new Error('Failed to fetch event dates')
      return response.json() as Promise<{ dates: string[] }>
    },
  })

  // Convert event date strings to Date objects for easy comparison
  const eventDates = useMemo(() => {
    if (!eventDatesData?.dates) return new Set<string>()
    return new Set(eventDatesData.dates)
  }, [eventDatesData])

  // Create a matcher function for event dates
  const hasEvent = useMemo(() => {
    return (day: Date) => {
      const dateString = day.toISOString().split('T')[0]
      return eventDates.has(dateString)
    }
  }, [eventDates])

  // Handle date selection - navigate to dashboard with date param if event exists
  const handleDateSelect = useCallback((selectedDate: Date | undefined) => {
    setDate(selectedDate)

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]
      // Only navigate if this date has events
      if (eventDates.has(dateString)) {
        // If not on dashboard, navigate there with the date param
        if (pathname !== '/dashboard') {
          router.push(`/dashboard?date=${dateString}`)
        } else {
          // Already on dashboard, just update the URL param
          router.push(`/dashboard?date=${dateString}`, { scroll: false })
        }
      }
    }
  }, [eventDates, router, pathname])

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent className="px-2">
        {state === "expanded" ? (
          <CalendarUI
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            modifiers={{ hasEvent }}
            modifiersClassNames={{
              hasEvent: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
            }}
            className="p-0 [&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px]"
          />
        ) : (
          <div className="flex items-center justify-center py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}