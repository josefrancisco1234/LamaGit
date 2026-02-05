"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AuthModal } from "@/components/auth-modal"

export default function AuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = React.useState(true)

  React.useEffect(() => {
    if (!loading && user) {
      router.push("/game")
    }
  }, [user, loading, router])

  const handleClose = (open: boolean) => {
    setShowModal(open)
    if (!open) {
      router.push("/game")
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-main-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-main-gradient">
      <AuthModal open={showModal} onOpenChange={handleClose} />
    </div>
  )
}
