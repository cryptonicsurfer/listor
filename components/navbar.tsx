'use client';
import { FileIcon, LogOutIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function Navbar() {
  const { logout } = useAuth()

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <FileIcon className="size-4" />
            </div>
            <span className="font-semibold">Branschlista</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </div>
    </header>
  )
}