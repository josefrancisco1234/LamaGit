"use client"

import * as React from "react"
import { Wallet, Plus, Gift } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { RechargeModal } from "@/components/recharge-modal"
import { formatBalance } from "@/lib/utils"

const WAGER_GOAL = 250

export function WalletWidget() {
  const { wallet, user } = useAuth()
  const [showRechargeModal, setShowRechargeModal] = React.useState(false)

  if (!user) return null

  const bonusBalance = Number(wallet?.bonus_balance ?? 0)
  const totalWagered = Number(wallet?.total_wagered ?? 0)
  const wagerProgress = Math.min(totalWagered / WAGER_GOAL, 1)
  const hasBonus = bonusBalance > 0

  return (
    <>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center justify-center gap-2">
          {/* Balance Pill */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border"
            style={{
              background: "linear-gradient(135deg, #0f1b35 0%, #1a2a4a 100%)",
              borderColor: "rgba(255,255,255,0.12)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" }}
            >
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-wide">
              S/ {formatBalance(wallet?.balance ?? 0)}
            </span>
          </div>

          {/* Gold "+" Recharge Button */}
          <button
            onClick={() => setShowRechargeModal(true)}
            className="flex items-center justify-center w-11 h-11 rounded-2xl transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 16px rgba(245,158,11,0.5)",
            }}
            title="Recargar saldo"
          >
            <Plus className="w-5 h-5 text-white font-bold" strokeWidth={3} />
          </button>
        </div>

        {/* Bonus bar — solo visible si hay bono pendiente */}
        {hasBonus && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl"
            style={{ background: "rgba(240,182,22,0.08)", border: "1px solid rgba(240,182,22,0.2)" }}>
            <Gift className="w-3 h-3 flex-shrink-0" style={{ color: "#f0b616" }} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold" style={{ color: "#f0b616" }}>
                  Bono S/ {formatBalance(bonusBalance)}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  S/ {totalWagered.toFixed(0)}/{WAGER_GOAL}
                </span>
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${wagerProgress * 100}%`, background: "linear-gradient(90deg, #f0b616, #22c55e)" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <RechargeModal open={showRechargeModal} onOpenChange={setShowRechargeModal} />
    </>
  )
}
