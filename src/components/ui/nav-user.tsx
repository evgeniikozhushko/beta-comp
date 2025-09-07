import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavUserProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  }
}

export function NavUser({ user }: NavUserProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar || ""} alt={user.name || ""} />
        <AvatarFallback>
          {user.name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user.name || 'User'}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
    </div>
  )
}