import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { ALLOWED_DOMAINS } from "@/lib/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    
    await login(email, password)
  }

  const domainList = ALLOWED_DOMAINS.join(", ")

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      {...props}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Branschlista Login</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email and password to login
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@falkenberg.se" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <p className="text-muted-foreground text-xs">
            Allowed domains: {domainList}
          </p>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
        <p className="text-muted-foreground text-sm text-center">
          This is a restricted application. Only pre-registered users with allowed email domains can login.
        </p>
      </div>
    </form>
  )
}
