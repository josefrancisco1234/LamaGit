"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { AuthModal } from "@/components/auth-modal"
import { WalletWidget } from "@/components/wallet-widget"
import { Settings, LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function useGlobalStats() {
  const [stats, setStats] = React.useState({ totalGames: 0, totalBet: 0 })

  React.useEffect(() => {
    const fetch_ = () =>
      fetch('/api/stats')
        .then(r => r.json())
        .then(d => setStats(d))
        .catch(() => {})

    fetch_()
    const id = setInterval(fetch_, 8000)
    return () => clearInterval(id)
  }, [])

  return stats
}

export function Header() {
  const { user, profile, signOut, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const stats = useGlobalStats()

  const handleLogout = async () => {
    await signOut()
    setShowSettings(false)
  }

  return (
    <header className="h-[72px] border-b border-border bg-header-gradient flex items-center px-4 lg:px-6">
      {/* Logo - same width as sidebar so center aligns with content */}
      <div className="flex items-center gap-3 lg:w-[270px]">
        <Image
          src="/logo.png"
          alt="LamaDice"
          width={44}
          height={44}
          className="object-contain"
          priority
        />
        <div className="hidden sm:flex flex-col">
          <span className="text-xl font-bold text-primary leading-tight">
            LamaDice
          </span>
          {/* Live global stats */}
          <div className="flex items-center gap-2 mt-0.5">
            {/* Pulse indicator */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
              {stats.totalGames.toLocaleString('es-PE')} partidas
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: "#f0b616" }}>
              S/ {stats.totalBet.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} apostados
            </span>
          </div>
        </div>
      </div>

      {/* Center - Wallet Widget, centered over content area */}
      <div className="flex-1 flex justify-center translate-x-[152px]">
        {loading ? (
          <div className="animate-pulse bg-muted h-10 w-48 rounded-2xl" />
        ) : (
          <WalletWidget />
        )}
      </div>

      {/* Right side - same width as logo for symmetry */}
      <div className="flex items-center justify-end gap-2 lg:w-[270px]">
        {!loading && !user && (
          <Button onClick={() => setShowAuthModal(true)} className="font-semibold">
            Iniciar Sesion
          </Button>
        )}
        {!loading && user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Configuracion</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">Usuario</span>
              <span className="font-medium">{profile?.username}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="text-success font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Sesion activa
              </span>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
