import { FileIcon } from "lucide-react"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Branschlista",
  description: "Login to access the Branschlista application",
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <FileIcon className="size-4" />
            </div>
            Branschlista
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-3xl font-bold mb-4">Falkenberg Branschlista</h2>
            <p className="text-lg mb-6">
              En intern tjänst för anställda inom Falkenbergs kommun och Ecoera.
            </p>
            <p className="text-muted-foreground">
              Logga in med din arbetsmail för att få tillgång.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
