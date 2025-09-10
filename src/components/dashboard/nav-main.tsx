"use client"

import { type LucideIcon } from "lucide-react"
import { useMemo } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Calendar, Users, BarChart3, Home, Settings } from "lucide-react"
import { hasPermission } from "@/lib/types/permissions"
import { User } from "@/lib/auth"
import Link from "next/link"
import { ErrorBoundary } from "@/components/ui/error-boundary"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavMainProps {
  user: User
}

function AdminNavItems({ user }: { user: User }) {
  const adminItems = useMemo(() => {
    try {
      return hasPermission(user.role, 'canManageUsers') ? [
        {
          title: "User Management",
          url: "/dashboard/athletes/manage",
          icon: Settings,
        },
      ] : []
    } catch (error) {
      console.error('Error calculating admin permissions:', error)
      return []
    }
  }, [user.role])
  
  try {
    if (adminItems.length === 0) return null

    return (
      <SidebarGroup>
        <SidebarGroupLabel>Administration</SidebarGroupLabel>
        <SidebarMenu>
          {adminItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    )
  } catch (error) {
    console.error('Error rendering admin navigation:', error)
    return null
  }
}

export function NavMain({ user }: NavMainProps) {
  const mainItems: NavItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: Calendar,
    },
    {
      title: "Athletes",
      url: "/dashboard/athletes",
      icon: Users,
    },
    {
      title: "Statistics",
      url: "/dashboard/stats",
      icon: BarChart3,
    },
  ]

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <ErrorBoundary fallback={null}>
        <AdminNavItems user={user} />
      </ErrorBoundary>
    </>
  )
}