"use client"

import { useState, useMemo } from "react"
import { Accordion } from "@/components/ui/accordion"
import EventAccordionItem from "@/components/EventAccordionItem"
import YearFilter from "@/components/YearFilter"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

type FacilityOption = { id: string; name: string }

interface EventData {
  _id: string
  name: string
  date: string
  durationDays: number
  facility: any
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
  userRole?: string
  userId?: string
  isLoading?: boolean
  error?: string | null
}

export default function EventAccordion({
  events,
  facilities,
  userRegistrations,
  userCanRegister,
  userRole,
  userId,
  isLoading = false,
  error = null
}: EventAccordionProps) {
  // Extract available years from events and get current year
  const availableYears = useMemo(() => {
    const years = events.map(event => new Date(event.date).getFullYear())
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a) // Most recent first
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()]
  }, [events])

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear())

  // Filter events by selected year and sort by date
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => new Date(event.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Earliest first
  }, [events, selectedYear])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

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
      <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
            {filteredEvents.map((event) => {
              const eventId = event._id.toString()
              const userRegistrationStatus = userRegistrations[eventId] || null

              return (
                <EventAccordionItem
                  key={eventId}
                  event={event}
                  facilities={facilities}
                  userRegistrationStatus={userRegistrationStatus}
                  userCanRegister={userCanRegister}
                  userRole={userRole}
                  userId={userId}
                />
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}