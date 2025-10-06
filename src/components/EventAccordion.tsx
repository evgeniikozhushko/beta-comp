"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Accordion } from "@/components/ui/accordion"
import EventAccordionItem from "@/components/EventAccordionItem"
import YearFilter from "@/components/YearFilter"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { UserRole } from "@/lib/types/permissions"

type FacilityOption = { id: string; name: string }

interface FacilityData {
  _id: string;
  name: string;
  city?: string;
  province: string;
}

interface EventData {
  _id: string
  name: string
  date: string
  durationDays: number
  facility: FacilityData
  discipline: string
  ageCategories: string[]
  division: string
  description?: string
  registrationDeadline?: string
  maxCapacity?: number
  registrationCount?: number
  allowRegistration?: boolean
  createdBy: string
}

interface EventAccordionProps {
  events: EventData[]
  facilities: FacilityOption[]
  userRegistrations: Record<string, string>
  userCanRegister: boolean
  userRole?: UserRole
  userId?: string
  isLoading?: boolean
  error?: string | null
  selectedDate?: string | null // Optional date filter (YYYY-MM-DD format)
}

export default function EventAccordion({
  events,
  facilities,
  userRegistrations,
  userCanRegister,
  userRole,
  userId,
  isLoading = false,
  error = null,
  selectedDate = null
}: EventAccordionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const firstMatchingEventRef = useRef<HTMLDivElement>(null)
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)

  // Extract available years from events and get current year
  const availableYears = useMemo(() => {
    const years = events.map(event => new Date(event.date).getFullYear())
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a) // Most recent first
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()]
  }, [events])

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear())

  // Helper function to check if a date falls within an event's date range
  const eventIncludesDate = useMemo(() => {
    return (event: EventData, targetDate: string) => {
      // Format event start date as YYYY-MM-DD (avoid timezone issues)
      const eventStartDate = new Date(event.date)
      const eventStartYear = eventStartDate.getFullYear()
      const eventStartMonth = String(eventStartDate.getMonth() + 1).padStart(2, '0')
      const eventStartDay = String(eventStartDate.getDate()).padStart(2, '0')
      const eventStartString = `${eventStartYear}-${eventStartMonth}-${eventStartDay}`

      // Calculate end date
      const eventEndDate = new Date(eventStartDate)
      eventEndDate.setDate(eventStartDate.getDate() + (event.durationDays - 1))
      const eventEndYear = eventEndDate.getFullYear()
      const eventEndMonth = String(eventEndDate.getMonth() + 1).padStart(2, '0')
      const eventEndDay = String(eventEndDate.getDate()).padStart(2, '0')
      const eventEndString = `${eventEndYear}-${eventEndMonth}-${eventEndDay}`

      // Compare date strings instead of Date objects to avoid timezone issues
      return targetDate >= eventStartString && targetDate <= eventEndString
    }
  }, [])

  // Filter events by selected year and sort by date
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => new Date(event.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Earliest first
  }, [events, selectedYear])

  // Find events matching the selected date
  const matchingEventIds = useMemo(() => {
    if (!selectedDate) return new Set<string>()
    return new Set(
      filteredEvents
        .filter(event => eventIncludesDate(event, selectedDate))
        .map(event => event._id)
    )
  }, [selectedDate, filteredEvents, eventIncludesDate])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  // Scroll to first matching event when selectedDate changes
  useEffect(() => {
    if (selectedDate && matchingEventIds.size > 0 && firstMatchingEventRef.current) {
      // Set highlight immediately
      setHighlightedDate(selectedDate)

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        firstMatchingEventRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)

      // Remove highlight after 1 second
      const timer = setTimeout(() => {
        setHighlightedDate(null)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [selectedDate, matchingEventIds])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Events</h2>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Events</h2>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">Error loading events</p>
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Year Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Events 
          {filteredEvents.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''})
            </span>
          )}
        </h2>
        
        {availableYears.length > 1 && (
          <YearFilter
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={handleYearChange}
          />
        )}
      </div>

      {/* Events Accordion with Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {events.length === 0
                ? "No events found."
                : `No events found for ${selectedYear}.`
              }
            </p>
            {availableYears.length > 1 && events.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different year above.
              </p>
            )}
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-2"
          >
            {filteredEvents.map((event, index) => {
              const eventId = event._id.toString()
              const userRegistrationStatus = (userRegistrations[eventId] as "registered" | "waitlisted") || null
              const isMatchingDate = matchingEventIds.has(eventId)
              const isFirstMatch = isMatchingDate && index === filteredEvents.findIndex(e => matchingEventIds.has(e._id))
              const shouldHighlight = isMatchingDate && highlightedDate === selectedDate

              return (
                <div
                  key={eventId}
                  ref={isFirstMatch ? firstMatchingEventRef : null}
                  className={shouldHighlight ? "bg-primary/10 rounded-sm transition-colors duration-500" : ""}
                >
                  <EventAccordionItem
                    event={event}
                    facilities={facilities}
                    userRegistrationStatus={userRegistrationStatus}
                    userCanRegister={userCanRegister}
                    userRole={userRole}
                    userId={userId}
                  />
                </div>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}