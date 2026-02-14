"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { AuthModal } from "@/components/auth-modal"
import { RechargeModal } from "@/components/recharge-modal"
import { formatBalance } from "@/lib/utils"
import { Wallet, Settings, LogOut, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function Header() {
  const { user, profile, wallet, signOut, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const [showRechargeModal, setShowRechargeModal] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)

  const handleLogout = async () => {
    await signOut()
    setShowSettings(false)
  }

  return (
    <header className="h-[72px] border-b border-border bg-header-gradient flex items-center justify-between px-4 lg:px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-[38px] h-[38px] overflow-hidden">
          <Image
            src="/logo.png"
            alt="LamaBet"
            width={38}
            height={38}
            className="object-contain"
            priority
          />
        </div>
        <span className="text-xl font-bold text-primary hidden sm:block">
          LamaBet
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {loading ? (
          <div className="animate-pulse bg-muted h-10 w-32 rounded-full" />
        ) : user ? (
          <>
            {/* Balance Pill */}
            <div className="flex items-center gap-2 bg-balance-gradient px-3 py-1.5 rounded-full shadow-lg">
              <Wallet className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                S/ {formatBalance(wallet?.balance ?? 0)}
              </span>
            </div>

            {/* Recharge Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRechargeModal(true)}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Recargar</span>
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <Button onClick={() => setShowAuthModal(true)} className="font-semibold">
            Iniciar Sesion
          </Button>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Recharge Modal */}
      <RechargeModal open={showRechargeModal} onOpenChange={setShowRechargeModal} />

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
