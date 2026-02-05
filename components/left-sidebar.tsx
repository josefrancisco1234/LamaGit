"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { AuthModal } from "@/components/auth-modal"
import { cn } from "@/lib/utils"
import {
  Gift,
  Users,
  Crown,
  BookOpen,
  Shield,
  HelpCircle,
  MessageCircle,
  LogIn,
} from "lucide-react"

interface NavItem {
  icon: React.ElementType
  label: string
  href?: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: Gift, label: "Promociones" },
  { icon: Users, label: "Afiliados" },
  { icon: Crown, label: "Club VIP" },
  { icon: BookOpen, label: "Blog" },
  { icon: Shield, label: "Juego Responsable" },
  { icon: HelpCircle, label: "Centro de Ayuda" },
  { icon: MessageCircle, label: "Soporte en vivo" },
]

export function LeftSidebar() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = React.useState(false)

  return (
    <aside className="w-[270px] border-r border-border bg-sidebar-gradient flex flex-col py-4 hidden lg:flex">
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 px-3 text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </nav>

      {/* Login button for non-authenticated users */}
      {!user && (
        <div className="px-3 pt-4 border-t border-border">
          <Button
            onClick={() => setShowAuthModal(true)}
            className="w-full justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesion
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pt-4 mt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          LamaBet v1.0.0
        </p>
        <p className="text-xs text-muted-foreground/60 text-center mt-1">
          Solo para fines educativos
        </p>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </aside>
  )
}
