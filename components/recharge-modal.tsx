"use client"

import * as React from "react"
import Image from "next/image"
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
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"

interface RechargeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RechargeState = "setup" | "pending" | "verifying" | "approved" | "expired"

const PRESET_AMOUNTS = [5, 10, 20, 50]
const MIN_AMOUNT = 5
const QR_TIMEOUT = 120 // 2 minutes in seconds

export function RechargeModal({ open, onOpenChange }: RechargeModalProps) {
  const [amount, setAmount] = React.useState<number>(10)
  const [state, setState] = React.useState<RechargeState>("setup")
  const [timeLeft, setTimeLeft] = React.useState(QR_TIMEOUT)
  const [tempCode, setTempCode] = React.useState("")

  const { user, refreshWallet } = useAuth()
  const { toast } = useToast()

  // Generate a random temporary code
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  // Reset modal state
  const resetModal = () => {
    setState("setup")
    setTimeLeft(QR_TIMEOUT)
    setTempCode("")
  }

  // Handle close
  const handleClose = (open: boolean) => {
    if (!open) resetModal()
    onOpenChange(open)
  }

  // Timer for QR expiration
  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (state === "pending" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setState("expired")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [state, timeLeft])

  const handleGenerateQR = () => {
    if (amount < MIN_AMOUNT) {
      toast({
        title: "Monto invalido",
        description: `El monto minimo es S/ ${MIN_AMOUNT}`,
        variant: "destructive",
      })
      return
    }

    setTempCode(generateCode())
    setTimeLeft(QR_TIMEOUT)
    setState("pending")
  }

  const handleVerifyPayment = async () => {
    setState("verifying")

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 1800))

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
      await walletAdd(amount)
      await refreshWallet()
      setState("approved")

      toast({
        title: "Recarga exitosa!",
        description: `S/ ${formatBalance(amount)} agregados a tu billetera`,
        variant: "default",
      })
    } catch (error) {
      setState("pending")
      toast({
        title: "Error",
        description: "No se pudo procesar la recarga",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Recargar Billetera</DialogTitle>
        </DialogHeader>

        {/* Setup State */}
        {state === "setup" && (
          <div className="space-y-4">
            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? "default" : "outline"}
                  onClick={() => setAmount(preset)}
                  className="h-12"
                >
                  S/ {preset}
                </Button>
              ))}
            </div>

            {/* Custom amount */}
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

            <Button
              onClick={handleGenerateQR}
              className="w-full"
              disabled={amount < MIN_AMOUNT}
            >
              Generar QR de Pago
            </Button>
          </div>
        )}

        {/* Pending State - Show QR */}
        {state === "pending" && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-primary mb-2">
                S/ {formatBalance(amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Escanea el codigo QR para pagar
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <Image
                src="/qr.svg"
                alt="QR de Pago"
                width={180}
                height={180}
                className="rounded"
              />
            </div>

            {/* Temp code */}
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Codigo de referencia
              </p>
              <p className="font-mono font-bold tracking-wider">{tempCode}</p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-warning">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                Expira en {formatTime(timeLeft)}
              </span>
            </div>

            <Button onClick={handleVerifyPayment} className="w-full">
              Ya Pague
            </Button>

            <Button
              variant="ghost"
              onClick={() => setState("setup")}
              className="w-full text-muted-foreground"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Verifying State */}
        {state === "verifying" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-accent" />
            <p className="text-lg font-medium">Verificando pago...</p>
            <p className="text-sm text-muted-foreground">
              Esto puede tomar unos segundos
            </p>
          </div>
        )}

        {/* Approved State */}
        {state === "approved" && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-success" />
            <p className="text-lg font-medium text-success">Recarga Exitosa!</p>
            <p className="text-2xl font-bold">S/ {formatBalance(amount)}</p>
            <p className="text-sm text-muted-foreground">
              El saldo ha sido agregado a tu billetera
            </p>
            <Button onClick={() => handleClose(false)} className="w-full mt-4">
              Continuar
            </Button>
          </div>
        )}

        {/* Expired State */}
        {state === "expired" && (
          <div className="py-8 text-center space-y-4">
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <p className="text-lg font-medium text-destructive">QR Expirado</p>
            <p className="text-sm text-muted-foreground">
              El codigo QR ha expirado. Por favor genera uno nuevo.
            </p>
            <Button onClick={() => setState("setup")} className="w-full mt-4">
              Generar Nuevo QR
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
