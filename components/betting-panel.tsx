// =============================================================================
// BETTING-PANEL.TSX - Panel Principal del Juego de Dados
// =============================================================================
// Este componente maneja toda la logica del juego:
// - Animacion del dado (numeros aleatorios girando)
// - Calculo de ganancia/perdida
// - Actualizacion de balance
// - Historial de apuestas
// =============================================================================

"use client" // Componente de cliente (usa hooks de React)

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

// =============================================================================
// TIPOS - Define la estructura del historial de apuestas
// =============================================================================
interface HistoryItem {
  result: number      // Resultado del dado (0.01 - 98.02)
  threshold: number   // Umbral seleccionado por el usuario
  won: boolean        // true si gano, false si perdio
  bet: number         // Monto apostado
  payout: number      // Pago recibido (0 si perdio)
  timestamp: number   // Cuando ocurrio la apuesta
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
export function BettingPanel() {
  // ---------------------------------------------------------------------------
  // ESTADO - Variables que controlan la UI
  // ---------------------------------------------------------------------------
  const [bet, setBet] = React.useState<number>(0.01)             // Monto de apuesta actual
  const [threshold, setThreshold] = React.useState<number>(50)   // Umbral (probabilidad de ganar)
  const [rolling, setRolling] = React.useState(false)            // true mientras el dado gira
  const [displayNumber, setDisplayNumber] = React.useState<number | null>(null) // Numero mostrado en pantalla
  const [lastResult, setLastResult] = React.useState<{           // Resultado del ultimo tiro
    number: number
    won: boolean
  } | null>(null)
  const [history, setHistory] = React.useState<HistoryItem[]>([]) // Historial de apuestas
  const [uiError, setUiError] = React.useState("")               // Mensaje de error en UI
  const [showAuthRequired, setShowAuthRequired] = React.useState(false) // Modal de auth requerida
  const [showAuthModal, setShowAuthModal] = React.useState(false)       // Modal de login/registro

  // ---------------------------------------------------------------------------
  // CONTEXTO DE AUTENTICACION
  // ---------------------------------------------------------------------------
  const { user, wallet, refreshWallet } = useAuth()
  const { toast } = useToast()

  // ===========================================================================
  // REFS CRITICAS - Previenen "stale closures" en callbacks async
  // ===========================================================================
  // PROBLEMA: Cuando un callback async (setTimeout, setInterval) accede a una
  // variable de estado, captura el valor al momento de crear el callback.
  // Si el estado cambia despues, el callback sigue viendo el valor viejo.
  //
  // SOLUCION: Usar refs que siempre apuntan al valor actual.
  // Los effects sincronizan las refs con el estado.
  // ---------------------------------------------------------------------------
  const isRollingRef = React.useRef(false)           // Indica si el dado esta girando
  const completingRef = React.useRef(false)          // Lock para evitar completar 2 veces
  const pendingBetRef = React.useRef<number>(bet)    // Apuesta actual (para usar en callbacks)
  const pendingThresholdRef = React.useRef<number>(threshold) // Umbral actual
  const walletRef = React.useRef(wallet)             // Billetera actual
  const userRef = React.useRef(user)                 // Usuario actual
  const rollStartTimeRef = React.useRef<number>(0)   // Timestamp de cuando empezo el tiro
  const finalResultRef = React.useRef<number | null>(null) // Resultado final pre-generado

  // ---------------------------------------------------------------------------
  // REFS DE ANIMACION - Guardan los IDs de los timers para poder cancelarlos
  // ---------------------------------------------------------------------------
  const animationIntervalRef = React.useRef<NodeJS.Timeout | null>(null) // Intervalo de numeros aleatorios
  const animationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)  // Timeout para completar
  const guardIntervalRef = React.useRef<NodeJS.Timeout | null>(null)     // Intervalo de guardia
  const lastVisibilityResetRef = React.useRef<number>(0)                 // Timestamp del ultimo reset por visibilidad

  // ---------------------------------------------------------------------------
  // SINCRONIZAR REFS CON ESTADO
  // ---------------------------------------------------------------------------
  // Cada vez que el estado cambia, actualiza la ref correspondiente
  // Esto garantiza que los callbacks async siempre tengan el valor mas reciente
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

  // ---------------------------------------------------------------------------
  // CLEANUP AL DESMONTAR - Cancela todos los timers
  // ---------------------------------------------------------------------------
  // Si el usuario navega a otra pagina, cancelamos todo para evitar memory leaks
  React.useEffect(() => {
    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      if (guardIntervalRef.current) clearInterval(guardIntervalRef.current)
    }
  }, [])

  // ===========================================================================
  // RECUPERACION AL VOLVER A LA PESTANA (Alt+Tab)
  // ===========================================================================
  // PROBLEMA: Cuando el usuario cambia de pestana durante una animacion,
  // los timers de JavaScript pueden pausarse o comportarse de manera erratica.
  // Al volver, la animacion puede quedarse "colgada".
  //
  // SOLUCION: Detectar cuando la pestana vuelve a ser visible y forzar
  // la finalizacion inmediata del tiro si estaba en progreso.
  // ---------------------------------------------------------------------------
  const forceResetDice = React.useCallback(() => {
    // ---------------------------------------------------------------------------
    // DEBOUNCE - Evitar multiples resets en rapida sucesion (Alt+Tab dispara
    // visibilitychange, focus, y pageshow casi simultaneamente)
    // ---------------------------------------------------------------------------
    const now = Date.now()
    if (now - lastVisibilityResetRef.current < 500) {
      // Ya se proceso un reset hace menos de 500ms, ignorar
      return
    }
    lastVisibilityResetRef.current = now

    // ---------------------------------------------------------------------------
    // LOCK - Usar el mismo lock que completeRoll para evitar conflictos
    // ---------------------------------------------------------------------------
    if (completingRef.current) {
      // Ya se esta completando un tiro, no interferir
      return
    }

    // Limpiar TODOS los timers inmediatamente
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

    // Si estaba girando, completar inmediatamente con el resultado pre-generado
    if (isRollingRef.current && finalResultRef.current !== null) {
      // Adquirir lock
      completingRef.current = true

      const finalNumber = finalResultRef.current
      const currentBet = pendingBetRef.current
      const currentThreshold = pendingThresholdRef.current
      const demo = isDemoMode(currentBet)
      const won = isWin(finalNumber, currentThreshold)
      const payout = calculatePayout(currentBet, currentThreshold, won)

      // Actualizar UI inmediatamente
      setDisplayNumber(finalNumber)
      setLastResult({ number: finalNumber, won })
      setRolling(false)
      isRollingRef.current = false
      rollStartTimeRef.current = 0

      // Agregar al historial
      setHistory((prev) => [{
        result: finalNumber,
        threshold: currentThreshold,
        won,
        bet: currentBet,
        payout: won ? payout : 0,
        timestamp: Date.now(),
      }, ...prev].slice(0, 100)) // Mantener solo los ultimos 100 resultados

      // Acreditar ganancias de forma async (no esperar)
      // El dinero ya se desconto al inicio del tiro
      if (won && !demo && userRef.current) {
        walletAdd(payout, userRef.current.id).then(() => refreshWallet()).catch(console.error)
      } else if (!demo && userRef.current) {
        // Solo refrescar para mostrar el descuento
        refreshWallet().catch(console.error)
      }

      finalResultRef.current = null
      // Liberar lock despues de un pequeno delay para asegurar que todo se proceso
      setTimeout(() => {
        completingRef.current = false
      }, 100)
    } else {
      // No estaba girando o no hay resultado - solo resetear estado
      setRolling(false)
      isRollingRef.current = false
      completingRef.current = false
      rollStartTimeRef.current = 0
      finalResultRef.current = null
    }
  }, [refreshWallet])

  // ---------------------------------------------------------------------------
  // EVENT LISTENERS PARA DETECTAR CUANDO VUELVE LA PESTANA
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    // Ref para debounce del refresh de wallet
    let walletRefreshTimeout: NodeJS.Timeout | null = null

    // Handler cuando cambia la visibilidad de la pestana
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // La pestana se volvio visible - resetear si esta girando
        // forceResetDice ya tiene su propio debounce interno
        if (isRollingRef.current) {
          forceResetDice()
        }
        // Refrescar wallet con debounce para evitar multiples llamadas
        if (userRef.current && !walletRefreshTimeout) {
          walletRefreshTimeout = setTimeout(() => {
            refreshWallet().catch(console.error)
            walletRefreshTimeout = null
          }, 300)
        }
      }
    }

    // Handler cuando la ventana recibe foco - NO llamar a forceResetDice aqui
    // porque visibilitychange ya lo maneja. Solo usamos focus como backup
    // si visibilitychange no se disparo (raro pero posible)
    const handleFocus = () => {
      // Solo procesar si NO hubo un reset reciente (el debounce en forceResetDice lo maneja)
      if (isRollingRef.current) {
        forceResetDice()
      }
    }

    // Registrar los event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    // Removido pageshow - no es necesario y causa duplicados

    // Cleanup: remover listeners al desmontar
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      if (walletRefreshTimeout) clearTimeout(walletRefreshTimeout)
    }
  }, [forceResetDice, refreshWallet])

  // ===========================================================================
  // COMPLETAR TIRO - Se ejecuta cuando termina la animacion
  // ===========================================================================
  const completeRoll = React.useCallback(async () => {
    // ---------------------------------------------------------------------------
    // PATRON LOCK - Evita que se ejecute multiples veces
    // ---------------------------------------------------------------------------
    // Sin este lock, el guard interval y el timeout normal podrian
    // ejecutar completeRoll al mismo tiempo, causando bugs
    if (completingRef.current) return
    completingRef.current = true

    try {
      // Limpiar todos los timers
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

      // Obtener el resultado final (usa ref para evitar stale closure)
      // El resultado ya fue generado al inicio del tiro
      const finalNumber = finalResultRef.current ?? generateDiceResult()
      const currentBet = pendingBetRef.current
      const currentThreshold = pendingThresholdRef.current
      const demo = isDemoMode(currentBet)

      // Determinar si gano o perdio
      // Gana si el resultado es <= al umbral seleccionado
      const won = isWin(finalNumber, currentThreshold)
      const payout = calculatePayout(currentBet, currentThreshold, won)
      const multiplier = calculateMultiplier(currentThreshold)

      // Actualizar pantalla
      setDisplayNumber(finalNumber)
      setLastResult({ number: finalNumber, won })
      setRolling(false)
      isRollingRef.current = false

      // Acreditar ganancias si gano (y no es demo)
      // NOTA: La apuesta ya fue descontada al inicio del tiro
      if (won && !demo && userRef.current) {
        try {
          await walletAdd(payout, userRef.current.id)
          await refreshWallet()
        } catch (error) {
          console.error("Error crediting winnings:", error)
        }
      } else if (!demo && userRef.current) {
        // Solo refrescar wallet para mostrar el balance actualizado
        await refreshWallet()
      }

      // Agregar al historial (maximo 100 items)
      const historyItem: HistoryItem = {
        result: finalNumber,
        threshold: currentThreshold,
        won,
        bet: currentBet,
        payout: won ? payout : 0,
        timestamp: Date.now(),
      }
      setHistory((prev) => [historyItem, ...prev].slice(0, 100))

      // Mostrar notificacion toast
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
      // SIEMPRE limpiar las refs, incluso si hay error
      completingRef.current = false
      rollStartTimeRef.current = 0
      finalResultRef.current = null
    }
  }, [refreshWallet, toast])

  // ===========================================================================
  // INICIAR TIRO - Se ejecuta cuando el usuario presiona "Tirar Dado"
  // ===========================================================================
  const handleRoll = async () => {
    setUiError("") // Limpiar errores previos

    // ---------------------------------------------------------------------------
    // VERIFICAR SI YA ESTA GIRANDO (Lock)
    // ---------------------------------------------------------------------------
    // Evita que el usuario pueda hacer multiples tiros simultaneos
    if (isRollingRef.current) {
      return
    }

    const currentBet = pendingBetRef.current
    const demo = isDemoMode(currentBet) // < 0.01 = modo demo

    // ---------------------------------------------------------------------------
    // VALIDACIONES
    // ---------------------------------------------------------------------------
    // Apuesta minima para modo real
    if (!demo && currentBet < 0.01) {
      setUiError("Apuesta minima: S/ 0.01")
      return
    }

    // Requiere login para apuestas reales
    if (!demo && !userRef.current) {
      setShowAuthRequired(true)
      return
    }

    // Verificar balance suficiente
    if (!demo && walletRef.current && currentBet > walletRef.current.balance) {
      setUiError("Saldo insuficiente")
      toast({
        title: "Saldo insuficiente",
        description: "Por favor recarga tu billetera",
        variant: "destructive",
      })
      return
    }

    // ---------------------------------------------------------------------------
    // ADQUIRIR LOCK E INICIAR ANIMACION
    // ---------------------------------------------------------------------------
    isRollingRef.current = true
    setRolling(true)
    setLastResult(null)
    rollStartTimeRef.current = Date.now()

    // PRE-GENERAR el resultado final ahora
    // Lo guardamos en una ref para que este disponible si hay Alt+Tab
    finalResultRef.current = generateDiceResult()

    // ---------------------------------------------------------------------------
    // DESCONTAR APUESTA (Solo para apuestas reales)
    // ---------------------------------------------------------------------------
    // IMPORTANTE: Descontamos ANTES de la animacion para evitar:
    // 1. Race conditions donde el usuario apuesta de nuevo
    // 2. Exploits donde el usuario cierra la pestana para cancelar
    if (!demo && userRef.current) {
      try {
        console.log("[DEBUG] Deducting bet:", currentBet)
        await walletAdd(-currentBet, userRef.current.id) // Monto negativo = descuento
        console.log("[DEBUG] Bet deducted successfully")
        await refreshWallet() // Actualizar UI inmediatamente
        console.log("[DEBUG] Wallet refreshed")
      } catch (error) {
        // Si falla el descuento, cancelar el tiro
        console.error("[DEBUG] Error deducting bet:", error)
        const errMsg = error instanceof Error ? error.message : "Error desconocido"
        isRollingRef.current = false
        setRolling(false)
        setUiError(`Error: ${errMsg}`)
        toast({
          title: "Error al apostar",
          description: errMsg.includes("policy")
            ? "Falta configurar permisos en la base de datos (RLS UPDATE policy)"
            : errMsg,
          variant: "destructive",
        })
        return
      }
    }

    // ---------------------------------------------------------------------------
    // ANIMACION: Numeros aleatorios cada 50ms
    // ---------------------------------------------------------------------------
    // Esto crea el efecto visual de "dado girando"
    animationIntervalRef.current = setInterval(() => {
      setDisplayNumber(generateDiceResult())
    }, 50)

    // ---------------------------------------------------------------------------
    // TIMEOUT: Completar despues de 1.2 segundos
    // ---------------------------------------------------------------------------
    animationTimeoutRef.current = setTimeout(() => {
      completeRoll()
    }, 1200)

    // ---------------------------------------------------------------------------
    // GUARD INTERVAL: Forzar completar si tarda >2 segundos
    // ---------------------------------------------------------------------------
    // Esto es una red de seguridad en caso de que el timeout principal falle
    // (puede pasar con Alt+Tab, throttling de CPU, etc)
    guardIntervalRef.current = setInterval(() => {
      if (rollStartTimeRef.current > 0) {
        const elapsed = Date.now() - rollStartTimeRef.current
        if (elapsed > 2000 && isRollingRef.current) {
          completeRoll()
        }
      }
    }, 500)
  }

  // ===========================================================================
  // HELPERS PARA AJUSTAR APUESTA
  // ===========================================================================

  // Multiplicar/dividir apuesta (para botones 1/2 y 2x)
  const adjustBet = (multiplier: number) => {
    setBet((prev) => {
      const newValue = prev * multiplier
      const maxBet = walletRef.current?.balance ?? 1000
      // Limitar entre 0.001 (demo) y el balance del usuario
      return Math.min(Math.max(0.001, Number(newValue.toFixed(3))), maxBet)
    })
  }

  // Apostar todo el balance
  const setMaxBet = () => {
    if (walletRef.current) {
      setBet(walletRef.current.balance)
    }
  }

  // Verificar si es modo demo (apuesta < 0.01)
  const isDemo = isDemoMode(bet)

  // ===========================================================================
  // RENDER - Interfaz de usuario
  // ===========================================================================
  return (
    <div className="space-y-6">
      {/* Tabs: Manual / Auto (proximamente) */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="auto" disabled>
            Auto (Proximamente)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-6">
          {/* ================================================================= */}
          {/* DISPLAY DEL DADO - Muestra el numero actual/resultado */}
          {/* ================================================================= */}
          <div className="bg-card-gradient rounded-xl p-8 border border-border text-center">
            <div
              className={`text-6xl font-bold transition-all duration-300 ${
                rolling ? "dice-spinning rolling-glow text-accent" : "" // Animacion de giro
              } ${
                lastResult
                  ? lastResult.won
                    ? "text-success win-animation"      // Verde si gano
                    : "text-destructive lose-animation" // Rojo si perdio
                  : "text-foreground"
              }`}
            >
              {/* Mostrar el numero apropiado segun el estado */}
              {rolling
                ? displayNumber?.toFixed(2) ?? "??.??"  // Durante animacion
                : lastResult
                ? lastResult.number.toFixed(2)          // Resultado final
                : displayNumber?.toFixed(2) ?? "??.??"} {/* Estado inicial */}
            </div>

            {/* Mensaje de GANASTE/PERDISTE */}
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

          {/* ================================================================= */}
          {/* DISPLAY DE PROBABILIDAD - Slider + multiplicador + historial */}
          {/* ================================================================= */}
          <ProbabilityDisplay
            threshold={threshold}
            onThresholdChange={setThreshold}
            bet={bet}
            disabled={rolling}
            history={history}
          />

          {/* ================================================================= */}
          {/* SECCION DE APUESTA - Input + botones de ajuste */}
          {/* ================================================================= */}
          <div className="bg-card-gradient rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">
                Monto de Apuesta
              </label>
              {/* Badge de modo demo */}
              {isDemo && (
                <span className="text-xs text-warning bg-warning/20 px-2 py-0.5 rounded">
                  Modo Demo
                </span>
              )}
            </div>

            {/* Controles de apuesta */}
            <div className="flex items-center gap-2">
              {/* Boton 1/2 - Divide la apuesta a la mitad */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBet(0.5)}
                disabled={rolling}
                className="shrink-0"
              >
                <span className="text-xs font-bold">1/2</span>
              </Button>

              {/* Input de monto */}
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

              {/* Boton 2x - Duplica la apuesta */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustBet(2)}
                disabled={rolling}
                className="shrink-0"
              >
                <span className="text-xs font-bold">2X</span>
              </Button>

              {/* Boton Max - Apuesta todo el balance */}
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

            {/* Botones rapidos de monto */}
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
                  {/* 0.001 = Demo, el resto muestra el monto */}
                  {amount < 0.01 ? "Demo" : `S/ ${amount}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Mensaje de error */}
          {uiError && (
            <p className="text-sm text-destructive text-center">{uiError}</p>
          )}

          {/* ================================================================= */}
          {/* BOTON PRINCIPAL - TIRAR DADO */}
          {/* ================================================================= */}
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

      {/* ================================================================= */}
      {/* MODALES DE AUTENTICACION */}
      {/* ================================================================= */}
      {/* Modal que aparece cuando intentas apostar sin estar logueado */}
      <AuthRequiredModal
        open={showAuthRequired}
        onOpenChange={setShowAuthRequired}
        onSignIn={() => setShowAuthModal(true)}
      />
      {/* Modal de login/registro */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}
