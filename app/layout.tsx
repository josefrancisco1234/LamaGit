import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { LoadingWrapper } from "@/components/loading-wrapper"
import { LiveChat } from "@/components/live-chat"

export const metadata: Metadata = {
  title: "LamaBet - Juego de Dados Online",
  description: "Juega dados con probabilidades configurables",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <LoadingWrapper>
              {children}
            </LoadingWrapper>
            <LiveChat />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
