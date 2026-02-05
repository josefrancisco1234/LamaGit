"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { AuthModal } from "@/components/auth-modal"
import { AuthRequiredModal } from "@/components/auth-required-modal"
import { ProbabilityDisplay } from "@/components/probability-display"
import {
  THRESHOLD_VALUES,
  calculateMultiplier,
  generateDiceResult,
  isWin,
  calculatePayout,
  isDemoMode,
  formatBalance,
} from "@/lib/utils"
import { walletAdd } from "@/lib/wallet"
import { useToast } from "@/hooks/use-toast"
import { Dice6, Minus, Plus } from "lucide-react"

interface HistoryItem {
  result: number
  threshold: number
  won: boolean
  bet: number
  payout: number
  timestamp: number
}

export function BettingPanel() {
  // State
  const [bet, setBet] = React.useState<number>(0.01)
  const [threshold, setThreshold] = React.useState<number>(50)
  const [rolling, setRolling] = React.useState(false)
  const [displayNumber, setDisplayNumber] = React.useState<number | null>(null)
  const [lastResult, setLastResult] = React.useState<{
    number: number
    won: boolean
  } | null>(null)
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [uiError, setUiError] = React.useState("")
  const [showAuthRequired, setShowAuthRequired] = React.useState(false)
  const [showAuthModal, setShowAuthModal] = React.useState(false)

  // Auth
  const { user, wallet, refreshWallet } = useAuth()
  const { toast } = useToast()

  // ============================================
  // CRITICAL: Refs for stale closure prevention
  // ============================================
  const isRollingRef = React.useRef(false)
  const completingRef = React.useRef(false)
  const pendingBetRef = React.useRef<number>(bet)
  const pendingThresholdRef = React.useRef<number>(threshold)
  const walletRef = React.useRef(wallet)
  const userRef = React.useRef(user)
  const rollStartTimeRef = React.useRef<number>(0)
  const finalResultRef = React.useRef<number | null>(null)

  // Animation refs
  const animationIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const guardIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Keep refs in sync with state
  React.useEffect(() => {
    pendingBetRef.current = bet
  }, [bet])

  React.useEffect(() => {
    pendingThresholdRef.current = threshold
  }, [threshold])

  React.useEffect(() => {
    walletRef.current = wallet
  }, [wallet])

  React.useEffect(() => {
    userRef.current = user
  }, [user])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      if (guardIntervalRef.current) clearInterval(guardIntervalRef.current)
    }
  }, [])

  // ============================================
  // Alt+Tab Recovery - IMMEDIATE RESET
  // ============================================
  const forceResetDice = React.useCallback(() => {
    // Clear ALL timers immediately
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current)
      animationIntervalRef.current = null
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }
    if (guardIntervalRef.current) {
      clearInterval(guardIntervalRef.current)
      guardIntervalRef.current = null
    }

    // If was rolling, complete it immediately
    if (isRollingRef.current && finalResultRef.current !== null) {
      const finalNumber = finalResultRef.current
      const currentBet = pendingBetRef.current
      const currentThreshold = pendingThresholdRef.current
      const demo = isDemoMode(currentBet)
      const won = isWin(finalNumber, currentThreshold)
      const payout = calculatePayout(currentBet, currentThreshold, won)

      // Update UI immediately
      setDisplayNumber(finalNumber)
      setLastResult({ number: finalNumber, won })
      setRolling(false)
      isRollingRef.current = false
      completingRef.current = false
      rollStartTimeRef.current = 0

      // Add to history
      setHistory((prev) => [{
        result: finalNumber,
        threshold: currentThreshold,
        won,
        bet: currentBet,
        payout: won ? payout : 0,
        timestamp: Date.now(),
      }, ...prev].slice(0, 100))

      // Credit winnings async (don't wait)
      if (won && !demo && userRef.current) {
        walletAdd(payout).then(() => refreshWallet()).catch(console.error)
      } else if (!demo && userRef.current) {
        refreshWallet().catch(console.error)
      }

      finalResultRef.current = null
    } else {
      // Just reset the state
      setRolling(false)
      isRollingRef.current = false
      completingRef.current = false
      rollStartTimeRef.current = 0
      finalResultRef.current = null
    }
  }, [refreshWallet])

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - IMMEDIATELY reset if rolling
        if (isRollingRef.current) {
          forceResetDice()
        }
        // Always refresh wallet when coming back
        if (userRef.current) {
          refreshWallet().catch(console.error)
        }
      }
    }

    const handleFocus = () => {
      // IMMEDIATELY reset if rolling
      if (isRollingRef.current) {
        forceResetDice()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("pageshow", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pageshow", handleFocus)
    }
  }, [forceResetDice, refreshWallet])

  // ============================================
  // Complete Roll (with lock pattern)
  // ============================================
  const completeRoll = React.useCallback(async () => {
    // Lock pattern to prevent multiple executions
    if (completingRef.current) return
    completingRef.current = true

    try {
      // Clear all timers
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      if (guardIntervalRef.current) {
        clearInterval(guardIntervalRef.current)
        guardIntervalRef.current = null
      }

      // Get the final result (use ref to avoid stale closure)
      const finalNumber = finalResultRef.current ?? generateDiceResult()
      const currentBet = pendingBetRef.current
      const currentThreshold = pendingThresholdRef.current
      const demo = isDemoMode(currentBet)

      // Determine win/lose
      const won = isWin(finalNumber, currentThreshold)
      const payout = calculatePayout(currentBet, currentThreshold, won)
      const multiplier = calculateMultiplier(currentThreshold)

      // Update display
      setDisplayNumber(finalNumber)
      setLastResult({ number: finalNumber, won })
      setRolling(false)
      isRollingRef.current = false

      // Credit winnings if won (and not demo)
      if (won && !demo && userRef.current) {
        try {
          await walletAdd(payout)
          await refreshWallet()
        } catch (error) {
          console.error("Error crediting winnings:", error)
        }
      } else if (!demo && userRef.current) {
        // Just refresh wallet to show updated balance
        await refreshWallet()
      }

      // Add to history
      const historyItem: HistoryItem = {
        result: finalNumber,
        threshold: currentThreshold,
        won,
        bet: currentBet,
        payout: won ? payout : 0,
        timestamp: Date.now(),
      }
      setHistory((prev) => [historyItem, ...prev].slice(0, 100))

      // Show toast
      if (demo) {
        toast({
          title: won ? "Ganaste (Demo)" : "Perdiste (Demo)",
          description: won
            ? `Resultado: ${finalNumber.toFixed(2)} - Pago simulado: S/ ${formatBalance(payout)}`
            : `Resultado: ${finalNumber.toFixed(2)} - Mejor suerte la proxima`,
          variant: won ? "default" : "destructive",
        })
      } else {
        toast({
          title: won ? "Ganaste!" : "Perdiste",
          description: won
            ? `Resultado: ${finalNumber.toFixed(2)} - Ganancia: S/ ${formatBalance(payout)} (${multiplier.toFixed(2)}x)`
            : `Resultado: ${finalNumber.toFixed(2)} - Perdiste S/ ${formatBalance(currentBet)}`,
          variant: won ? "default" : "destructive",
        })
      }
    } finally {
      completingRef.current = false
      rollStartTimeRef.current = 0
      finalResultRef.current = null
    }
  }, [refreshWallet, toast])

  // ============================================
  // Start Roll
  // ============================================
  const handleRoll = async () => {
    setUiError("")

    // Check if already rolling (lock)
    if (isRollingRef.current) {
      return
    }

    const currentBet = pendingBetRef.current
    const demo = isDemoMode(currentBet)

    // Validation
    if (!demo && currentBet < 0.01) {
      setUiError("Apuesta minima: S/ 0.01")
      return
    }

    // Auth check for real bets
    if (!demo && !userRef.current) {
      setShowAuthRequired(true)
      return
    }

    // Balance check for real bets
    if (!demo && walletRef.current && currentBet > walletRef.current.balance) {
      setUiError("Saldo insuficiente")
      toast({
        title: "Saldo insuficiente",
        description: "Por favor recarga tu billetera",
        variant: "destructive",
      })
      return
    }

    // Acquire lock
    isRollingRef.current = true
    setRolling(true)
    setLastResult(null)
    rollStartTimeRef.current = Date.now()

    // Generate the final result now (store in ref)
    finalResultRef.current = generateDiceResult()

    // Deduct bet for real bets
    if (!demo && userRef.current) {
      try {
        await walletAdd(-currentBet)
        await refreshWallet()
      } catch (error) {
        console.error("Error deducting bet:", error)
        isRollingRef.current = false
        setRolling(false)
        setUiError("Error al procesar la apuesta")
        return
      }
    }

    // Start animation (random numbers every 50ms)
    animationIntervalRef.current = setInterval(() => {
      setDisplayNumber(generateDiceResult())
    }, 50)

    // Complete after 1.2 seconds
    animationTimeoutRef.current = setTimeout(() => {
      completeRoll()
    }, 1200)

    // Guard interval: if >2s passed, force complete
    guardIntervalRef.current = setInterval(() => {
      if (rollStartTimeRef.current > 0) {
        const elapsed = Date.now() - rollStartTimeRef.current
        if (elapsed > 2000 && isRollingRef.current) {
          completeRoll()
        }
      }
    }, 500)
  }

  // ============================================
  // Bet adjustment helpers
  // ============================================
  const adjustBet = (multiplier: number) => {
    setBet((prev) => {
      const newValue = prev * multiplier
      const maxBet = walletRef.current?.balance ?? 1000
      return Math.min(Math.max(0.001, Number(newValue.toFixed(3))), maxBet)
    })
  }

  const setMaxBet = () => {
    if (walletRef.current) {
      setBet(walletRef.current.balance)
    }
  }

  const isDemo = isDemoMode(bet)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="auto" disabled>
            Auto (Proximamente)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-6">
          {/* Dice Display */}
          <div className="bg-card-gradient rounded-xl p-8 border border-border text-center">
            <div
              className={`text-6xl font-bold transition-all duration-300 ${
                rolling ? "dice-spinning rolling-glow text-accent" : ""
              } ${
                lastResult
                  ? lastResult.won
                    ? "text-success win-animation"
                    : "text-destructive lose-animation"
                  : "text-foreground"
              }`}
            >
              {rolling
                ? displayNumber?.toFixed(2) ?? "??.??"
                : lastResult
                ? lastResult.number.toFixed(2)
                : displayNumber?.toFixed(2) ?? "??.??"}
            </div>

            {lastResult && !rolling && (
              <p
                className={`mt-2 text-lg font-semibold ${
                  lastResult.won ? "text-success" : "text-destructive"
                }`}
              >
                {lastResult.won ? "GANASTE!" : "PERDISTE"}
              </p>
            )}
          </div>

          {/* Probability Display & Slider */}
          <ProbabilityDisplay
            threshold={threshold}
            onThresholdChange={setThreshold}
            bet={bet}
            disabled={rolling}
            history={history}
          />

          {/* Bet Amount */}
          <div className="bg-card-gradient rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">
                Monto de Apuesta
              </label>
              {isDemo && (
                <span className="text-xs text-warning bg-warning/20 px-2 py-0.5 rounded">
                  Modo Demo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBet(0.5)}
                disabled={rolling}
                className="shrink-0"
              >
                <span className="text-xs font-bold">1/2</span>
              </Button>

              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  value={bet}
                  onChange={(e) =>
                    setBet(Math.max(0, Number(e.target.value)))
                  }
                  step={0.01}
                  min={0}
                  disabled={rolling}
                  className="pl-9 bg-secondary border-border text-center font-mono"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBet(2)}
                disabled={rolling}
                className="shrink-0"
              >
                <span className="text-xs font-bold">2X</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={setMaxBet}
                disabled={rolling || !user}
                className="shrink-0"
              >
                Max
              </Button>
            </div>

            {/* Quick bet buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.001, 0.01, 1, 10].map((amount) => (
                <Button
                  key={amount}
                  variant={bet === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBet(amount)}
                  disabled={rolling}
                  className="text-xs"
                >
                  {amount < 0.01 ? "Demo" : `S/ ${amount}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {uiError && (
            <p className="text-sm text-destructive text-center">{uiError}</p>
          )}

          {/* Roll Button */}
          <Button
            onClick={handleRoll}
            disabled={rolling}
            size="xl"
            className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-white"
          >
            {rolling ? (
              <>
                <Dice6 className="w-6 h-6 mr-2 dice-spinning" />
                Tirando...
              </>
            ) : (
              <>
                <Dice6 className="w-6 h-6 mr-2" />
                Tirar Dado
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Auth Modals */}
      <AuthRequiredModal
        open={showAuthRequired}
        onOpenChange={setShowAuthRequired}
        onSignIn={() => setShowAuthModal(true)}
      />
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}
