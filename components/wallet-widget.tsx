"use client"

import * as React from "react"
import { Wallet, ChevronDown, Plus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { RechargeModal } from "@/components/recharge-modal"
import { formatBalance } from "@/lib/utils"

export function WalletWidget() {
  const { wallet, user } = useAuth()
  const [showRechargeModal, setShowRechargeModal] = React.useState(false)

  if (!user) return null

  return (
    <>
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
          {/* Green Wallet Icon */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" }}
          >
            <Wallet className="w-4 h-4 text-white" />
          </div>

          {/* Balance */}
          <span className="text-white font-bold text-base tracking-wide">
            S/ {formatBalance(wallet?.balance ?? 0)}
          </span>

          {/* Dropdown arrow */}
          <ChevronDown className="w-4 h-4 text-gray-400" />
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

      <RechargeModal open={showRechargeModal} onOpenChange={setShowRechargeModal} />
    </>
  )
}
