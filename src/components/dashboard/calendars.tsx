"use client"

import { Calendar } from "@/components/ui/calendar"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { useState, useEffect } from "react"

export function Calendars() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  
  useEffect(() => {
    setDate(new Date())
  }, [])

  return (
    <SidebarGroup className="px-0">
      {/* <SidebarGroupLabel className="px-2">Calendar</SidebarGroupLabel> */}
      <SidebarGroupContent className="px-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="p-0 [&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}