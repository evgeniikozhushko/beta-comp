"use client"

import { useSearchParams } from "next/navigation"
import EventAccordion from "@/components/EventAccordion"
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

interface EventAccordionWrapperProps {
  events: EventData[]
  facilities: FacilityOption[]
  userRegistrations: Record<string, string>
  userCanRegister: boolean
  userRole?: UserRole
  userId?: string
  isLoading?: boolean
  error?: string | null
}

export default function EventAccordionWrapper(props: EventAccordionWrapperProps) {
  const searchParams = useSearchParams()
  const selectedDate = searchParams?.get('date') ?? null

  return <EventAccordion {...props} selectedDate={selectedDate} />
}
