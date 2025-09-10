"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { User } from "@/lib/auth"

interface NavUserProps {
  user: User
}

export function NavUser({ user }: NavUserProps) {
  const { state } = useSidebar()
  const router = useRouter()

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'athlete':
        return 'outline'
      case 'official':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleSignOut = async () => {
    router.push('/api/auth/signout')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {state === "expanded" ? (
          <>
            <div className="flex items-center gap-2 pl-2">
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.displayName}</span>
                <div className="flex items-center gap-2 pb-2">
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {user.role}
                </Badge>
              </div>
            </div>
            <div className="px-0 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center px-1 py-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}