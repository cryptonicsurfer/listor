import { FileIcon, LogOutIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-background border-b">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <FileIcon className="size-4" />
            </div>
            <span className="font-semibold">Branschlista</span>
          </Link>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              {user.name}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}