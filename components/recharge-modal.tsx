// =============================================================================
// RECHARGE-MODAL.TSX - Modal para Recargar la Billetera
// =============================================================================
// Este componente maneja el flujo de recarga de dinero:
// 1. Usuario selecciona el monto a recargar
// 2. Se muestra un codigo QR (simulado) para pagar
// 3. El usuario confirma que ya pago
// 4. Se verifica (simulado) y se acredita el dinero
// =============================================================================

"use client" // Componente de cliente (usa hooks de React)

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { walletAdd } from "@/lib/wallet"
import { useToast } from "@/hooks/use-toast"
import { formatBalance } from "@/lib/utils"
import { Loader2, Clock } from "lucide-react"

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================
interface RechargeModalProps {
  open: boolean                        // Si el modal esta abierto
  onOpenChange: (open: boolean) => void // Callback para abrir/cerrar
}

// Estados posibles del flujo de recarga
// setup    -> Usuario eligiendo monto
// pending  -> Mostrando QR, esperando pago
// verifying-> Verificando el pago
// approved -> Pago aprobado, dinero acreditado
// expired  -> El QR expiro (timeout)
type RechargeState = "setup" | "pending" | "verifying" | "approved" | "expired"

// =============================================================================
// CONSTANTES
// =============================================================================
const PRESET_AMOUNTS = [5, 10, 20, 50]  // Montos predefinidos para seleccion rapida
const MIN_AMOUNT = 5                    // Monto minimo de recarga
const QR_TIMEOUT = 300                  // 5 minutos para pagar antes de que expire

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
export function RechargeModal({ open, onOpenChange }: RechargeModalProps) {
  // ---------------------------------------------------------------------------
  // ESTADO
  // ---------------------------------------------------------------------------
  const [amount, setAmount] = React.useState<number>(10)           // Monto seleccionado
  const [state, setState] = React.useState<RechargeState>("setup") // Estado actual del flujo
  const [timeLeft, setTimeLeft] = React.useState(QR_TIMEOUT)       // Tiempo restante para pagar
  const [tempCode, setTempCode] = React.useState("")               // Codigo de referencia unico

  // ---------------------------------------------------------------------------
  // CONTEXTO Y HOOKS
  // ---------------------------------------------------------------------------
  const { user, refreshWallet } = useAuth() // Usuario actual y funcion para refrescar balance
  const { toast } = useToast()              // Para mostrar notificaciones

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Genera un codigo alfanumerico aleatorio de 8 caracteres
   * Ejemplo: "A3B7C9D2"
   * Se usa como referencia de pago para identificar la transaccion
   */
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  /**
   * Resetea el modal a su estado inicial
   * Se llama al cerrar o al cancelar
   */
  const resetModal = () => {
    setState("setup")
    setTimeLeft(QR_TIMEOUT)
    setTempCode("")
  }

  /**
   * Maneja el cierre del modal
   * Resetea el estado si se esta cerrando
   */
  const handleClose = (open: boolean) => {
    if (!open) resetModal()
    onOpenChange(open)
  }

  // ---------------------------------------------------------------------------
  // TIMER PARA EXPIRACION DEL QR
  // ---------------------------------------------------------------------------
  // Cuando el estado es "pending", cuenta regresiva cada segundo
  // Si llega a 0, cambia a estado "expired"
  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (state === "pending" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1))
      }, 1000)
    }

    // Cuando llega a 0 estando en pending: cerrar el modal automaticamente
    if (state === "pending" && timeLeft === 0) {
      setState("setup")
      setTimeLeft(QR_TIMEOUT)
      setTempCode("")
      onOpenChange(false)
    }

    return () => clearInterval(interval)
  }, [state, timeLeft, onOpenChange])

  // ---------------------------------------------------------------------------
  // GENERAR QR - Inicia el proceso de pago
  // ---------------------------------------------------------------------------
  const handleGenerateQR = () => {
    // Validar monto minimo
    if (amount < MIN_AMOUNT) {
      toast({
        title: "Monto invalido",
        description: `El monto minimo es S/ ${MIN_AMOUNT}`,
        variant: "destructive",
      })
      return
    }

    // Generar codigo de referencia unico
    setTempCode(generateCode())
    // Reiniciar el timer
    setTimeLeft(QR_TIMEOUT)
    // Cambiar a estado de espera de pago
    setState("pending")
  }

  // ---------------------------------------------------------------------------
  // VERIFICAR PAGO - El usuario dice que ya pago
  // ---------------------------------------------------------------------------
  const handleVerifyPayment = async () => {
    setState("verifying")

    if (!user) {
      setState("setup")
      toast({
        title: "Error",
        description: "Debes iniciar sesion",
        variant: "destructive",
      })
      return
    }

    try {
      // Crear solicitud de recarga PENDIENTE (el admin la aprueba desde /dev)
      const res = await fetch('/api/recharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.user_metadata?.username || user.email || 'Sin nombre',
          amount,
          code: tempCode,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create recharge request')
      }

      // Cambiar a estado aprobado (en realidad es "enviado, esperando aprobacion")
      setState("approved")

      toast({
        title: "Solicitud enviada!",
        description: `Tu recarga de S/ ${formatBalance(amount)} esta pendiente de aprobacion`,
        variant: "default",
      })
    } catch (error) {
      setState("pending")
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud",
        variant: "destructive",
      })
    }
  }

  // ---------------------------------------------------------------------------
  // FORMATEAR TIEMPO - Convierte segundos a formato "M:SS"
  // ---------------------------------------------------------------------------
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)           // Minutos
    const secs = seconds % 60                       // Segundos restantes
    return `${mins}:${secs.toString().padStart(2, "0")}` // Ejemplo: "1:45"
  }

  // ===========================================================================
  // RENDER - Interfaz de usuario
  // ===========================================================================
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Recargar Billetera</DialogTitle>
        </DialogHeader>

        {/* ================================================================= */}
        {/* ESTADO: SETUP - Seleccion de monto */}
        {/* ================================================================= */}
        {state === "setup" && (
          <div className="space-y-4">
            {/* Botones de montos predefinidos */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? "default" : "outline"} // Resaltar el seleccionado
                  onClick={() => setAmount(preset)}
                  className="h-12"
                >
                  S/ {preset}
                </Button>
              ))}
            </div>

            {/* Input para monto personalizado */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Monto personalizado
              </label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">S/</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={MIN_AMOUNT}
                  step={1}
                  className="bg-secondary border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Monto minimo: S/ {MIN_AMOUNT}
              </p>
            </div>

            {/* Boton para generar QR */}
            <Button
              onClick={handleGenerateQR}
              className="w-full"
              disabled={amount < MIN_AMOUNT}
            >
              Generar QR de Pago
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* ESTADO: PENDING - Mostrando QR y esperando pago */}
        {/* ================================================================= */}
        {state === "pending" && (
          <div className="space-y-4">
            {/* Monto a pagar */}
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-primary mb-2">
                S/ {formatBalance(amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Escanea el codigo QR para pagar
              </p>
            </div>

            {/* Imagen del QR - Yape */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/yape.png"
                alt="QR Yape"
                style={{ width: "180px", height: "180px", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>

            {/* Codigo de referencia */}
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Codigo de referencia
              </p>
              <p className="font-mono font-bold tracking-wider">{tempCode}</p>
            </div>

            {/* Timer de expiracion - rojo y pulsando cuando quedan <= 60s */}
            <div
              className={`flex items-center justify-center gap-2 font-medium ${
                timeLeft <= 60
                  ? "text-destructive animate-pulse"
                  : "text-warning"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Expira en {formatTime(timeLeft)}</span>
            </div>

            {/* Boton "Ya Pague" */}
            <Button onClick={handleVerifyPayment} className="w-full">
              Ya Pague
            </Button>

            {/* Boton Cancelar */}
            <Button
              variant="ghost"
              onClick={() => setState("setup")}
              className="w-full text-muted-foreground"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* ESTADO: VERIFYING - Verificando el pago */}
        {/* ================================================================= */}
        {state === "verifying" && (
          <div className="py-8 text-center space-y-4">
            {/* Spinner animado */}
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-accent" />
            <p className="text-lg font-medium">Verificando pago...</p>
            <p className="text-sm text-muted-foreground">
              Esto puede tomar unos segundos
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* ESTADO: APPROVED - Pago aprobado exitosamente */}
        {/* ================================================================= */}
        {state === "approved" && (
          <div className="py-8 text-center space-y-4">
            {/* Icono de pendiente */}
            <Clock className="w-16 h-16 mx-auto text-warning" />
            <p className="text-lg font-medium text-warning">Solicitud Enviada!</p>
            <p className="text-2xl font-bold">S/ {formatBalance(amount)}</p>
            <p className="text-sm text-muted-foreground">
              Tu recarga esta pendiente de aprobacion.
              <br />
              El saldo se agregara cuando el administrador la apruebe.
            </p>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Codigo de referencia</p>
              <p className="font-mono font-bold">{tempCode}</p>
            </div>
            {/* Boton para cerrar */}
            <Button onClick={() => handleClose(false)} className="w-full mt-4">
              Entendido
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
