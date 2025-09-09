"use client"

import { Button } from "@/components/ui/button"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import EventRegistrationButton from "@/components/EventRegistrationButton"
import UpdateEventSheet from "@/components/UpdateEventSheet"
import DeleteEventButton from "@/components/DeleteEventButton"
import { canManageEvent } from "@/lib/types/permissions"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mountain, Users } from "lucide-react"

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

interface EventAccordionItemProps {
  event: EventData
  facilities: FacilityOption[]
  userRegistrationStatus: string | null
  userCanRegister: boolean
  userRole?: string
  userId?: string
}

export default function EventAccordionItem({
  event,
  facilities,
  userRegistrationStatus,
  userCanRegister,
  userRole,
  userId
}: EventAccordionItemProps) {
  const eventId = event._id.toString()

  // Registration status logic
  const getEventRegistrationStatus = (event: EventData) => {
    if (event.allowRegistration === false) return 'closed'
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) return 'closed'
    if (event.maxCapacity && event.maxCapacity > 0 && (event.registrationCount || 0) >= event.maxCapacity) return 'full'
    return 'open'
  }

  const eventStatus = getEventRegistrationStatus(event)
  
  // Format date for display
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default'
      case 'full': return 'secondary' 
      case 'closed': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <AccordionItem value={eventId}>
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex flex-col items-start gap-2 w-full">
          <div className="flex items-center justify-start w-full">
            <span className="font-semibold text-base">{event.name}</span>
            <Badge variant={getStatusBadgeVariant(eventStatus)} className="ml-4">
              {eventStatus === 'open' ? 'Active' : eventStatus === 'full' ? 'Full' : 'Closed'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              {event.discipline}
            </span>
            <span className="flex items-center gap-1">
              {event.facility.name}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="space-y-6 pt-2">
        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <span className="font-medium text-foreground">Date & Time:</span>
              <p className="text-muted-foreground mt-1">
                {formattedDate} at {formattedTime}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-foreground">Facility:</span>
              <p className="text-muted-foreground mt-1">
                {typeof event.facility === "object" && event.facility?.name
                  ? event.facility.name
                  : "Unknown"}
              </p>
            </div>

            <div>
              <span className="font-medium text-foreground">Duration:</span>
              <p className="text-muted-foreground mt-1">
                {event.durationDays} day{event.durationDays > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-medium text-foreground">Categories:</span>
              <p className="text-muted-foreground mt-1">
                {event.ageCategories?.join(", ") || "All"}
              </p>
            </div>

            {event.maxCapacity && (
              <div>
                <span className="font-medium text-foreground">Capacity:</span>
                <p className="text-muted-foreground mt-1">
                  {event.registrationCount || 0} / {event.maxCapacity} registered
                </p>
              </div>
            )}

            {event.registrationDeadline && (
              <div>
                <span className="font-medium text-foreground">Registration Deadline:</span>
                <p className="text-muted-foreground mt-1">
                  {new Date(event.registrationDeadline).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="border-t pt-4">
            <span className="font-medium text-foreground">Description:</span>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Registration Section */}
        <div className="border-t pt-4">
          <EventRegistrationButton
            eventId={eventId}
            userRegistrationStatus={userRegistrationStatus}
            eventStatus={eventStatus}
            registrationCount={event.registrationCount || 0}
            maxCapacity={event.maxCapacity || 0}
            registrationDeadline={event.registrationDeadline}
            isAuthenticated={true}
            userCanRegister={userCanRegister}
          />
        </div>

        {/* Admin Controls */}
        {userRole && userId && canManageEvent(userRole, event.createdBy, userId, 'update') && (
          <div className="border-t pt-4">
            <div className="flex gap-2 flex-wrap">
              <UpdateEventSheet
                facilities={facilities}
                eventId={eventId}
              >
                <Button variant="outline" size="sm">
                  Edit Event
                </Button>
              </UpdateEventSheet>
              {canManageEvent(userRole, event.createdBy, userId, 'delete') && (
                <DeleteEventButton
                  eventId={eventId}
                  eventName={event.name}
                />
              )}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}