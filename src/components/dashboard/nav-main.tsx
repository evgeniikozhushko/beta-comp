"use client"

import { type LucideIcon } from "lucide-react"

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

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavMainProps {
  user: User
}

export function NavMain({ user }: NavMainProps) {
  // Simple navigation items without dropdown complexity
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

  // Admin-only navigation items
  const adminItems: NavItem[] = hasPermission(user.role, 'canManageUsers') ? [
    {
      title: "User Management",
      url: "/dashboard/athletes/manage",
      icon: Settings,
    },
  ] : []

  return (
    <>
      {/* Main Navigation */}
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

      {/* Admin Navigation */}
      {adminItems.length > 0 && (
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
      )}
    </>
  )
}