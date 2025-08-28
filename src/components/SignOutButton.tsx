import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOutIcon } from "lucide-react"

export function SignOutButton() {
    return (
        <form action={async () => {
            "use server"
            await signOut()
        }}>
            <Button
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                type="submit"
            >
                <LogOutIcon className="h-4 w-4" />
                Sign Out
            </Button>
        </form>
    )
}