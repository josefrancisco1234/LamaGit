"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { X, Gift } from "lucide-react"

const STORAGE_KEY = "lama_referral_code"

function ReferralBannerInner() {
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState("")

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && ref.trim()) {
      localStorage.setItem(STORAGE_KEY, ref.trim())
      setCode(ref.trim())
      setVisible(true)
    }
  }, [searchParams])

  if (!visible || !code) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-purple-600/20 border border-purple-500/40 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-purple-400 shrink-0" />
        <p className="text-sm text-purple-200">
          Codigo de referido{" "}
          <span className="font-bold text-white">"{code}"</span>{" "}
          detectado.{" "}
          <span className="text-purple-300">Registrate para activarlo y ganar bonos!</span>
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-purple-400 hover:text-white transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ReferralBanner() {
  return (
    <Suspense fallback={null}>
      <ReferralBannerInner />
    </Suspense>
  )
}

// Helper para que auth-modal lea el codigo guardado
export function getStoredReferralCode(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(STORAGE_KEY) || ""
}

export function clearStoredReferralCode() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
