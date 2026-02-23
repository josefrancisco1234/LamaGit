"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { getAffiliateStats, type AffiliateStats } from "@/lib/affiliates"
import { Copy, Check, Users, TrendingUp, Coins } from "lucide-react"
import { formatBalance } from "@/lib/utils"

interface AffiliatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AffiliatesModal({ open, onOpenChange }: AffiliatesModalProps) {
  const { user, profile } = useAuth()
  const [copied, setCopied] = React.useState(false)
  const [stats, setStats] = React.useState<AffiliateStats>({
    totalEarned: 0,
    referencesCount: 0,
    recentEarnings: [],
  })
  const [loadingStats, setLoadingStats] = React.useState(false)

  const referralCode = profile?.username ?? ""
  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/game?ref=${encodeURIComponent(referralCode)}`
      : `https://lamabet.com/game?ref=${encodeURIComponent(referralCode)}`

  // Load stats when modal opens
  React.useEffect(() => {
    if (open && user) {
      setLoadingStats(true)
      getAffiliateStats(user.id)
        .then(setStats)
        .finally(() => setLoadingStats(false))
    }
  }, [open, user])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-bold">Referir y ganar</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="referir" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-none border-b border-border h-12">
            <TabsTrigger value="referir" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Referir Amigos
            </TabsTrigger>
            <TabsTrigger value="ganancias" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Mis Ganancias
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: REFERIR AMIGOS ─── */}
          <TabsContent value="referir" className="p-6 space-y-5 mt-0">
            {/* Banner */}
            <div
              className="rounded-xl p-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #3730a3 0%, #6d28d9 50%, #7c3aed 100%)",
              }}
            >
              {/* Decorative circles */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                <div className="w-32 h-32 rounded-full border-4 border-white" />
                <div className="w-20 h-20 rounded-full border-4 border-white absolute top-6 left-6" />
              </div>

              <div className="relative z-10 max-w-[60%]">
                <h3 className="text-white text-xl font-black leading-tight mb-2">
                  Refiere a tus amigos
                </h3>
                <p className="text-white/80 text-sm leading-snug">
                  Comparte tu codigo <strong className="text-yellow-300">"{referralCode}"</strong> y gana{" "}
                  <strong className="text-yellow-300">1%</strong> de cada apuesta que pierdan tus referidos.
                </p>
              </div>

              {/* Coins decoration */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-60">
                <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-yellow-800" />
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-300 border-2 border-yellow-500 ml-3" />
                <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-yellow-700 ml-1" />
              </div>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              <div className="bg-secondary rounded-lg p-3 space-y-1">
                <p className="text-lg">🔗</p>
                <p>Comparte tu link</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 space-y-1">
                <p className="text-lg">🎮</p>
                <p>Tu amigo juega</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 space-y-1">
                <p className="text-lg font-bold text-success">1%</p>
                <p>Ganas de sus pérdidas</p>
              </div>
            </div>

            {/* Referral code */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Tu código de referido
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-mono font-bold text-primary tracking-widest"
                  style={{ background: "rgba(251,191,36,0.05)" }}
                >
                  {referralCode || "—"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Referral URL */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Comparte tu enlace de referencia
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary text-xs text-muted-foreground font-mono truncate">
                  {referralUrl}
                </div>
                <Button
                  onClick={handleCopy}
                  className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar URL
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── TAB 2: MIS GANANCIAS ─── */}
          <TabsContent value="ganancias" className="p-6 space-y-4 mt-0">
            {loadingStats ? (
              <div className="text-center text-muted-foreground py-8">Cargando...</div>
            ) : (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Total earned */}
                  <div className="bg-secondary rounded-xl p-4 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Ganancias totales
                    </p>
                    <p className="text-2xl font-black text-success">
                      S/ {formatBalance(stats.totalEarned)}
                    </p>
                  </div>

                  {/* References */}
                  <div className="bg-secondary rounded-xl p-4 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Referencias activas
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {stats.referencesCount}
                    </p>
                  </div>
                </div>

                {/* Commission info */}
                <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Nivel de comision</p>
                    <p className="text-lg font-bold">Nivel 1</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Comision por perdida</p>
                    <p className="text-2xl font-black text-primary">1%</p>
                  </div>
                </div>

                {/* Recent earnings */}
                {stats.recentEarnings.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Ultimas comisiones
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {stats.recentEarnings.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg text-sm"
                        >
                          <span className="text-muted-foreground text-xs">
                            Apuesta perdida: S/ {formatBalance(e.bet_amount)}
                          </span>
                          <span className="text-success font-bold">
                            +S/ {formatBalance(e.commission_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <p className="text-2xl mb-2">📊</p>
                    <p>Aun no tienes ganancias de referidos.</p>
                    <p className="text-xs mt-1">Comparte tu codigo para empezar a ganar.</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
