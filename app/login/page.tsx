import { Metadata } from "next"
import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Login - Branschlista",
  description: "Login to access the Branschlista application",
}

export default function LoginPage() {
  return <ClientPage />
}
