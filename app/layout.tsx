import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { LoadingWrapper } from "@/components/loading-wrapper"
import { LiveChat } from "@/components/live-chat"

export const metadata: Metadata = {
  title: "LamaDice - Juego de Dados Online",
  description: "Juega dados con probabilidades configurables",
  openGraph: {
    title: "LamaDice - Juego de Dados Online",
    description: "Juega dados con probabilidades configurables",
    url: "https://www.lamadice.com",
    siteName: "LamaDice",
    images: [{ url: "https://www.lamadice.com/logo.png", width: 512, height: 512, alt: "LamaDice Logo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LamaDice - Juego de Dados Online",
    description: "Juega dados con probabilidades configurables",
    images: ["https://www.lamadice.com/logo.png"],
  },
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
