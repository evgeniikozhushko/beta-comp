"use client"

import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { CalendarDays } from "lucide-react"
import {
  SidebarGroup,
  
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"

export function Calendars() {
  const { state } = useSidebar()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate brief loading state to prevent layout shift
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <SidebarGroup className="px-0">
        <SidebarGroupContent className="px-2">
          {state === "expanded" ? (
            <div className="p-0">
              <Skeleton className="h-8 w-full mb-3" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent className="px-2">
        {state === "expanded" ? (
          <CalendarUI
            mode="single"
            selected={date}
            onSelect={setDate}
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