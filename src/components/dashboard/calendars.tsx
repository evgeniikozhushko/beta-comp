"use client"

import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { CalendarDays } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

export function Calendars() {
  const { state } = useSidebar()
  const [date, setDate] = useState<Date | undefined>(new Date())

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

  // Log for testing
  console.log('Event dates:', Array.from(eventDates))

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent className="px-2">
        {state === "expanded" ? (
          <CalendarUI
            mode="single"
            selected={date}
            onSelect={setDate}
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