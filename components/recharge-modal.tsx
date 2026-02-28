"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { formatBalance } from "@/lib/utils"
import { Loader2, Clock, Sparkles, ArrowDownToLine, ArrowUpFromLine, CheckCircle2 } from "lucide-react"

interface RechargeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RechargeState = "setup" | "payment-method" | "generating" | "pending" | "verifying" | "approved"
type ActiveTab = "depositar" | "retirar"

const PRESET_AMOUNTS = [5, 10, 20, 50]
const MIN_AMOUNT = 5
const QR_TIMEOUT = 300

export function RechargeModal({ open, onOpenChange }: RechargeModalProps) {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("depositar")

  // ── Deposit state ──
  const [amount, setAmount] = React.useState<number>(10)
  const [state, setState] = React.useState<RechargeState>("setup")
  const [timeLeft, setTimeLeft] = React.useState(QR_TIMEOUT)
  const [tempCode, setTempCode] = React.useState("")

  // ── Withdrawal state ──
  const [wAmount, setWAmount] = React.useState<number>(10)
  const [wName, setWName] = React.useState("")
  const [wPhone, setWPhone] = React.useState("")
  const [wDocType, setWDocType] = React.useState<"dni" | "pasaporte">("dni")
  const [wId, setWId] = React.useState("")
  const [wCci, setWCci] = React.useState("")
  const [wLoading, setWLoading] = React.useState(false)
  const [wDone, setWDone] = React.useState(false)

  const { user, wallet } = useAuth()
  const { toast } = useToast()

  const generateCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()

  const resetModal = () => {
    setState("setup")
    setTimeLeft(QR_TIMEOUT)
    setTempCode("")
    setWAmount(10)
    setWName("")
    setWPhone("")
    setWDocType("dni")
    setWId("")
    setWCci("")
    setWLoading(false)
    setWDone(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) { resetModal(); setActiveTab("depositar") }
    onOpenChange(open)
  }

  const handleWithdraw = async () => {
    if (!user) return
    if (!wName.trim() || !wPhone.trim() || !wId.trim() || !wCci.trim()) {
      toast({ title: "Campos incompletos", description: "Completa todos los campos", variant: "destructive" })
      return
    }
    if (wDocType === "dni" && wId.length !== 8) {
      toast({ title: "DNI inválido", description: "El DNI debe tener exactamente 8 dígitos", variant: "destructive" })
      return
    }
    if (wDocType === "pasaporte" && wId.trim().length < 6) {
      toast({ title: "Pasaporte inválido", description: "Ingresa un número de pasaporte válido", variant: "destructive" })
      return
    }
    if (wCci.length !== 20) {
      toast({ title: "CCI inválido", description: "El CCI debe tener exactamente 20 dígitos", variant: "destructive" })
      return
    }
    if (wAmount < 10) {
      toast({ title: "Monto invalido", description: "Minimo S/ 10 para retirar", variant: "destructive" })
      return
    }
    const balance = wallet?.balance ?? 0
    if (wAmount > balance) {
      toast({ title: "Saldo insuficiente", description: `Tu saldo es S/ ${formatBalance(balance)}`, variant: "destructive" })
      return
    }
    setWLoading(true)
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          username: user.user_metadata?.username || user.email || "Sin nombre",
          amount: wAmount,
          holder_name: wName.trim(),
          phone: wPhone.trim(),
          document_id: wId.trim(),
          cci: wCci.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed")
      setWDone(true)
    } catch {
      toast({ title: "Error", description: "No se pudo enviar la solicitud", variant: "destructive" })
    } finally {
      setWLoading(false)
    }
  }

  // Timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (state === "pending" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    if (state === "pending" && timeLeft === 0) {
      setState("setup")
      setTimeLeft(QR_TIMEOUT)
      setTempCode("")
      onOpenChange(false)
    }
    return () => clearInterval(interval)
  }, [state, timeLeft, onOpenChange])

  // Timer de 5s para simular generacion del QR
  React.useEffect(() => {
    if (state !== "generating") return
    const timer = setTimeout(() => setState("pending"), 5000)
    return () => clearTimeout(timer)
  }, [state])

  const handleGenerateQR = () => {
    if (amount < MIN_AMOUNT) {
      toast({ title: "Monto invalido", description: `Minimo S/ ${MIN_AMOUNT}`, variant: "destructive" })
      return
    }
    setTempCode(generateCode())
    setTimeLeft(QR_TIMEOUT)
    setState("payment-method")
  }

  const handleVerifyPayment = async () => {
    setState("verifying")
    if (!user) {
      setState("setup")
      toast({ title: "Error", description: "Debes iniciar sesion", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/recharges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          username: user.user_metadata?.username || user.email || "Sin nombre",
          amount,
          code: tempCode,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      setState("approved")
      toast({
        title: "Solicitud enviada!",
        description: `Tu recarga de S/ ${formatBalance(amount)} esta pendiente de aprobacion`,
      })
    } catch {
      setState("pending")
      toast({ title: "Error", description: "No se pudo enviar la solicitud", variant: "destructive" })
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const isUrgent = timeLeft <= 60

  return (
    <>
      {/* Estilos del modal premium */}
      <style>{`
        /* Boton X visible y por encima del contenido */
        .rm-content > button {
          z-index: 30 !important;
          color: rgba(255,255,255,0.8) !important;
          opacity: 1 !important;
        }

        .rm-content > button:hover {
          color: #f0b616 !important;
          background: rgba(240,182,22,0.12) !important;
          border-radius: 50%;
        }

        .rm-content {
          background: linear-gradient(160deg, #0d1b3e 0%, #111827 50%, #0a1020 100%);
          background-size: 300% 300%;
          animation: rm-shift 10s ease infinite;
          border: 1px solid rgba(240, 182, 22, 0.25) !important;
          border-radius: 20px !important;
          box-shadow: 0 0 60px rgba(240, 182, 22, 0.08), 0 25px 60px rgba(0,0,0,0.6) !important;
          overflow: hidden;
        }

        /* Brillo sutil en esquina superior */
        .rm-content::before {
          content: '';
          position: absolute;
          top: -60px;
          left: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(240,182,22,0.12) 0%, transparent 70%);
          pointer-events: none;
          animation: rm-glow-move 6s ease-in-out infinite alternate;
        }

        @keyframes rm-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes rm-glow-move {
          from { transform: translate(0, 0); }
          to   { transform: translate(80px, 80px); }
        }

        /* Botones de monto preestablecido */
        .rm-preset-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(240,182,22,0.3);
          color: #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .rm-preset-btn:hover {
          background: rgba(240,182,22,0.15);
          border-color: #f0b616;
          color: #f0b616;
          box-shadow: 0 0 16px rgba(240,182,22,0.3), inset 0 0 12px rgba(240,182,22,0.08);
          transform: translateY(-1px);
        }

        .rm-preset-btn.active {
          background: rgba(240,182,22,0.2);
          border-color: #f0b616;
          color: #f0b616;
          box-shadow: 0 0 20px rgba(240,182,22,0.35), inset 0 0 14px rgba(240,182,22,0.1);
        }

        /* Boton primario dorado */
        .rm-btn-gold {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #f0b616 0%, #d4920a 50%, #f0b616 100%);
          background-size: 200% 200%;
          color: #0a0f1a;
          letter-spacing: 0.03em;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(240,182,22,0.3);
        }

        .rm-btn-gold:hover {
          background-position: right center;
          box-shadow: 0 0 30px rgba(240,182,22,0.55), 0 4px 20px rgba(240,182,22,0.4);
          transform: translateY(-2px);
        }

        .rm-btn-gold:active {
          transform: translateY(0px);
        }

        .rm-btn-gold:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Boton secundario / cancelar */
        .rm-btn-ghost {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 0.9rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rm-btn-ghost:hover {
          border-color: rgba(240,182,22,0.4);
          color: #f0b616;
          background: rgba(240,182,22,0.06);
          box-shadow: 0 0 12px rgba(240,182,22,0.15);
        }

        /* Input personalizado */
        .rm-input {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(240,182,22,0.25) !important;
          border-radius: 10px !important;
          color: #e2e8f0 !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }

        .rm-input:focus {
          border-color: #f0b616 !important;
          box-shadow: 0 0 0 2px rgba(240,182,22,0.2) !important;
          outline: none !important;
        }

        /* Timer urgente */
        @keyframes rm-urgent-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .rm-timer-urgent {
          animation: rm-urgent-pulse 0.8s ease-in-out infinite;
        }

        /* ── Metodo de pago ── */
        .rm-method-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(240,182,22,0.25);
          cursor: pointer;
          transition: all 0.25s ease;
          width: 100%;
          text-align: left;
        }

        .rm-method-card:hover {
          background: rgba(240,182,22,0.1);
          border-color: #f0b616;
          box-shadow: 0 0 24px rgba(240,182,22,0.25), inset 0 0 16px rgba(240,182,22,0.06);
          transform: translateY(-2px);
        }

        .rm-method-card .rm-method-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 20px;
          background: rgba(34,197,94,0.15);
          color: #22c55e;
          border: 1px solid rgba(34,197,94,0.3);
          margin-left: auto;
          white-space: nowrap;
        }

        /* ── Dado 3D (animacion de carga del QR) ── */
        .rm-dice-scene {
          perspective: 600px;
          width: 120px;
          height: 120px;
        }

        .rm-dice {
          width: 120px;
          height: 120px;
          position: relative;
          transform-style: preserve-3d;
          animation: rm-dice-roll 4s linear infinite;
        }

        @keyframes rm-dice-roll {
          0%   { transform: rotateX(0deg)   rotateY(0deg); }
          25%  { transform: rotateX(90deg)  rotateY(180deg); }
          50%  { transform: rotateX(180deg) rotateY(360deg); }
          75%  { transform: rotateX(270deg) rotateY(540deg); }
          100% { transform: rotateX(360deg) rotateY(720deg); }
        }

        .rm-dice-face {
          position: absolute;
          width: 120px;
          height: 120px;
          border: 2px solid #f0b616;
          border-radius: 14px;
          overflow: hidden;
          backface-visibility: hidden;
          background: #1a2040;
          box-shadow: inset 0 0 16px rgba(240, 182, 22, 0.1);
        }

        .rm-dice-face img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @keyframes rm-dots {
          0%, 20%  { content: '.'; }
          40%      { content: '..'; }
          60%, 100%{ content: '...'; }
        }

        .rm-generating-dots::after {
          content: '';
          animation: rm-dots-anim 1.2s steps(1) infinite;
        }

        @keyframes rm-dots-anim {
          0%  { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="rm-content max-w-md p-0 gap-0 max-h-[90vh] flex flex-col">
          <div className="relative z-10 flex flex-col min-h-0 flex-1">

            {/* HEADER */}
            <div className="px-6 pt-6 pb-0 flex-shrink-0">
              <DialogHeader className="pb-3">
                <DialogTitle
                  className="text-center text-xl font-bold"
                  style={{ color: "#f0b616", letterSpacing: "0.04em" }}
                >
                  Billetera
                </DialogTitle>
              </DialogHeader>

              {/* TABS */}
              <div className="flex gap-1 p-1 rounded-xl mb-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <button
                  onClick={() => setActiveTab("depositar")}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                  style={activeTab === "depositar"
                    ? { background: "rgba(240,182,22,0.18)", color: "#f0b616", border: "1px solid rgba(240,182,22,0.4)" }
                    : { color: "#64748b", background: "transparent", border: "1px solid transparent" }
                  }
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Depositar
                </button>
                <button
                  onClick={() => { setActiveTab("retirar"); setWDone(false) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                  style={activeTab === "retirar"
                    ? { background: "rgba(34,197,94,0.18)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }
                    : { color: "#64748b", background: "transparent", border: "1px solid transparent" }
                  }
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  Retirar
                </button>
              </div>
            </div>

          <div className="p-6 pt-4 space-y-5 overflow-y-auto flex-1">

            {/* ======================== DEPOSITAR TAB ======================== */}
            {activeTab === "depositar" && state === "setup" && (
              <div className="space-y-5">
                {/* Montos preestablecidos */}
                <div>
                  <p className="text-xs text-center mb-3" style={{ color: "#94a3b8", letterSpacing: "0.1em" }}>
                    SELECCIONA UN MONTO
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        className={`rm-preset-btn ${amount === preset ? "active" : ""}`}
                        onClick={() => setAmount(preset)}
                      >
                        S/ {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monto personalizado */}
                <div className="space-y-2">
                  <label className="text-xs" style={{ color: "#94a3b8", letterSpacing: "0.08em" }}>
                    MONTO PERSONALIZADO
                  </label>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#f0b616", fontWeight: 700 }}>S/</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min={MIN_AMOUNT}
                      step={1}
                      className="rm-input"
                    />
                  </div>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    Monto minimo: S/ {MIN_AMOUNT}
                  </p>
                </div>

                {/* Boton generar QR */}
                <button
                  className="rm-btn-gold"
                  onClick={handleGenerateQR}
                  disabled={amount < MIN_AMOUNT}
                >
                  <Sparkles className="inline w-4 h-4 mr-2" />
                  Generar QR de Pago
                </button>
              </div>
            )}

            {/* ======================== PAYMENT METHOD ======================== */}
            {activeTab === "depositar" && state === "payment-method" && (
              <div className="space-y-5">
                {/* Monto seleccionado */}
                <div className="text-center py-3 rounded-xl" style={{ background: "rgba(240,182,22,0.08)", border: "1px solid rgba(240,182,22,0.2)" }}>
                  <p className="text-3xl font-black" style={{ color: "#f0b616" }}>S/ {formatBalance(amount)}</p>
                </div>

                <div>
                  <p className="text-xs text-center mb-4" style={{ color: "#94a3b8", letterSpacing: "0.1em" }}>
                    OPCIONES DE PAGO DISPONIBLES
                  </p>

                  {/* Yape */}
                  <button
                    className="rm-method-card"
                    onClick={() => setState("generating")}
                  >
                    {/* Logo Yape circular */}
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #6c1cd1 0%, #8b2fc9 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 0 16px rgba(108,28,209,0.4)"
                    }}>
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>Y</span>
                    </div>
                    <div>
                      <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1rem" }}>Yape</p>
                      <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "2px" }}>Pago instantaneo con QR</p>
                    </div>
                    <span className="rm-method-badge">Disponible</span>
                  </button>
                </div>

                <button className="rm-btn-ghost" onClick={() => setState("setup")}>
                  Volver
                </button>
              </div>
            )}

            {/* ======================== GENERATING ======================== */}
            {activeTab === "depositar" && state === "generating" && (
              <div className="py-8 text-center space-y-6">
                {/* Dado girando con glow */}
                <div className="flex justify-center">
                  <div style={{ position: "relative" }}>
                    {/* Aura */}
                    <div style={{
                      position: "absolute", inset: "-20px", borderRadius: "50%",
                      background: "rgba(240,182,22,0.18)", filter: "blur(30px)",
                      animation: "rm-shift 3s ease infinite",
                    }} />
                    <div className="rm-dice-scene" style={{ margin: "0 auto" }}>
                      <div className="rm-dice">
                        {[
                          `rotateY(0deg) translateZ(60px)`,
                          `rotateY(180deg) translateZ(60px)`,
                          `rotateY(90deg) translateZ(60px)`,
                          `rotateY(-90deg) translateZ(60px)`,
                          `rotateX(90deg) translateZ(60px)`,
                          `rotateX(-90deg) translateZ(60px)`,
                        ].map((transform, i) => (
                          <div key={i} className="rm-dice-face" style={{ transform }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.png" alt="LamaDice" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-lg font-bold rm-generating-dots" style={{ color: "#f0b616" }}>
                    Generando QR
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                    Preparando tu codigo de pago...
                  </p>
                </div>
              </div>
            )}

            {/* ======================== PENDING ======================== */}
            {activeTab === "depositar" && state === "pending" && (
              <div className="space-y-4">
                {/* Monto */}
                <div className="text-center py-3 rounded-xl" style={{ background: "rgba(240,182,22,0.08)", border: "1px solid rgba(240,182,22,0.2)" }}>
                  <p className="text-3xl font-black" style={{ color: "#f0b616" }}>
                    S/ {formatBalance(amount)}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
                    Escanea el codigo QR para pagar
                  </p>
                </div>

                {/* QR */}
                <div className="flex justify-center p-4 rounded-xl" style={{ background: "transparent" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/yape.png"
                    alt="QR Yape"
                    style={{ width: "190px", height: "190px", objectFit: "contain", borderRadius: "8px", display: "block" }}
                  />
                </div>

                {/* Codigo */}
                <div className="text-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748b", letterSpacing: "0.1em" }}>CODIGO DE REFERENCIA</p>
                  <p className="font-mono font-bold text-lg tracking-widest" style={{ color: "#e2e8f0" }}>
                    {tempCode}
                  </p>
                </div>

                {/* Timer */}
                <div
                  className={`flex items-center justify-center gap-2 font-semibold text-sm ${isUrgent ? "rm-timer-urgent" : ""}`}
                  style={{ color: isUrgent ? "#ef4444" : "#f59e0b" }}
                >
                  <Clock className="w-4 h-4" />
                  <span>Expira en {formatTime(timeLeft)}</span>
                </div>

                {/* Botones */}
                <button className="rm-btn-gold" onClick={handleVerifyPayment}>
                  Ya Pague
                </button>
                <button className="rm-btn-ghost" onClick={() => setState("setup")}>
                  Cancelar
                </button>
              </div>
            )}

            {/* ======================== VERIFYING ======================== */}
            {activeTab === "depositar" && state === "verifying" && (
              <div className="py-10 text-center space-y-4">
                <div style={{
                  width: "64px", height: "64px", margin: "0 auto",
                  borderRadius: "50%",
                  background: "rgba(240,182,22,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 30px rgba(240,182,22,0.2)"
                }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#f0b616" }} />
                </div>
                <p className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>Verificando pago...</p>
                <p className="text-sm" style={{ color: "#64748b" }}>Esto puede tomar unos segundos</p>
              </div>
            )}

            {/* ======================== APPROVED ======================== */}
            {activeTab === "depositar" && state === "approved" && (
              <div className="py-8 text-center space-y-4">
                <div style={{
                  width: "72px", height: "72px", margin: "0 auto",
                  borderRadius: "50%",
                  background: "rgba(240,182,22,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 40px rgba(240,182,22,0.25)"
                }}>
                  <Clock className="w-9 h-9" style={{ color: "#f0b616" }} />
                </div>
                <p className="text-lg font-bold" style={{ color: "#f0b616" }}>Solicitud Enviada!</p>
                <p className="text-3xl font-black" style={{ color: "#e2e8f0" }}>
                  S/ {formatBalance(amount)}
                </p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  Tu recarga esta pendiente de aprobacion.
                  <br />
                  El saldo se agregara cuando el administrador la apruebe.
                </p>
                <div className="rounded-xl py-3 px-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748b", letterSpacing: "0.1em" }}>CODIGO DE REFERENCIA</p>
                  <p className="font-mono font-bold tracking-widest" style={{ color: "#e2e8f0" }}>{tempCode}</p>
                </div>
                <button className="rm-btn-gold" onClick={() => handleClose(false)}>
                  Entendido
                </button>
              </div>
            )}

            {/* ======================== RETIRAR TAB ======================== */}
            {activeTab === "retirar" && !wDone && (
              <div className="space-y-4">
                {/* Saldo disponible */}
                <div className="text-center py-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "#64748b", letterSpacing: "0.1em" }}>SALDO DISPONIBLE</p>
                  <p className="text-3xl font-black" style={{ color: "#22c55e" }}>
                    S/ {formatBalance(wallet?.balance ?? 0)}
                  </p>
                </div>

                {/* Monto */}
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: "#94a3b8", letterSpacing: "0.08em" }}>MONTO A RETIRAR</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[10, 20, 50, 100].map((v) => (
                      <button
                        key={v}
                        className={`rm-preset-btn ${wAmount === v ? "active" : ""}`}
                        onClick={() => setWAmount(v)}
                      >
                        S/ {v}
                      </button>
                    ))}
                    <button
                      className={`rm-preset-btn ${wAmount === (wallet?.balance ?? 0) ? "active" : ""}`}
                      onClick={() => setWAmount(wallet?.balance ?? 0)}
                      style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.5)" }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>S/</span>
                    <Input
                      type="number"
                      value={wAmount}
                      onChange={(e) => setWAmount(Number(e.target.value))}
                      min={10}
                      step={1}
                      className="rm-input"
                    />
                  </div>
                  <p className="text-xs" style={{ color: "#64748b" }}>Mínimo S/ 10</p>
                </div>

                {/* Datos bancarios */}
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: "#94a3b8", letterSpacing: "0.08em" }}>DATOS DE RETIRO</p>

                  <div className="space-y-1">
                    <label className="text-xs" style={{ color: "#64748b" }}>Nombre del titular</label>
                    <Input
                      placeholder="Ej: Juan Pérez García"
                      value={wName}
                      onChange={(e) => setWName(e.target.value)}
                      className="rm-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs" style={{ color: "#64748b" }}>Número de celular</label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-2 rounded-lg text-sm font-bold shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(240,182,22,0.25)", color: "#94a3b8" }}>
                        +51
                      </span>
                      <Input
                        placeholder="987654321"
                        value={wPhone}
                        onChange={(e) => setWPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        className="rm-input"
                        maxLength={9}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Selector DNI / Pasaporte */}
                    <div className="flex gap-1 mb-1">
                      <button
                        type="button"
                        onClick={() => { setWDocType("dni"); setWId("") }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                        style={wDocType === "dni"
                          ? { background: "rgba(34,197,94,0.18)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }
                        }
                      >
                        DNI
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWDocType("pasaporte"); setWId("") }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                        style={wDocType === "pasaporte"
                          ? { background: "rgba(34,197,94,0.18)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }
                        }
                      >
                        Pasaporte
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs" style={{ color: "#64748b" }}>
                        {wDocType === "dni" ? "DNI (8 dígitos)" : "Número de pasaporte"}
                      </label>
                      {wDocType === "dni" && (
                        <span className="text-xs" style={{ color: wId.length === 8 ? "#22c55e" : "#64748b" }}>
                          {wId.length}/8
                        </span>
                      )}
                    </div>
                    {wDocType === "dni" ? (
                      <Input
                        placeholder="12345678"
                        value={wId}
                        onChange={(e) => setWId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        className="rm-input"
                        maxLength={8}
                      />
                    ) : (
                      <Input
                        placeholder="Ej: AB123456"
                        value={wId}
                        onChange={(e) => setWId(e.target.value.toUpperCase().slice(0, 12))}
                        className="rm-input"
                        maxLength={12}
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs" style={{ color: "#64748b" }}>Cuenta bancaria CCI (20 dígitos)</label>
                      <span className="text-xs" style={{ color: wCci.length === 20 ? "#22c55e" : "#64748b" }}>
                        {wCci.length}/20
                      </span>
                    </div>
                    <Input
                      placeholder="00219100123456789012"
                      value={wCci}
                      onChange={(e) => setWCci(e.target.value.replace(/\D/g, "").slice(0, 20))}
                      className="rm-input"
                      maxLength={20}
                    />
                  </div>
                </div>

                <button
                  className="rm-btn-gold"
                  style={{
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #22c55e 100%)",
                    backgroundSize: "200% 200%",
                    boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
                  }}
                  onClick={handleWithdraw}
                  disabled={
                    wLoading ||
                    !wName.trim() ||
                    !wPhone.trim() ||
                    !wId.trim() ||
                    !wCci.trim() ||
                    wAmount < 10 ||
                    (wDocType === "dni" && wId.length !== 8) ||
                    (wDocType === "pasaporte" && wId.trim().length < 6) ||
                    wCci.length !== 20
                  }
                >
                  {wLoading
                    ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Enviando...</>
                    : <><ArrowUpFromLine className="inline w-4 h-4 mr-2" />Solicitar Retiro</>
                  }
                </button>

                <p className="text-xs text-center" style={{ color: "#475569" }}>
                  El retiro será procesado manualmente en un plazo de 24–48h.
                </p>
              </div>
            )}

            {/* ======================== RETIRO ENVIADO ======================== */}
            {activeTab === "retirar" && wDone && (
              <div className="py-8 text-center space-y-4">
                <div style={{
                  width: "72px", height: "72px", margin: "0 auto",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 40px rgba(34,197,94,0.25)"
                }}>
                  <CheckCircle2 className="w-9 h-9" style={{ color: "#22c55e" }} />
                </div>
                <p className="text-lg font-bold" style={{ color: "#22c55e" }}>Solicitud Enviada!</p>
                <p className="text-3xl font-black" style={{ color: "#e2e8f0" }}>
                  S/ {formatBalance(wAmount)}
                </p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  Tu solicitud de retiro está siendo procesada.
                  <br />
                  Recibirás el pago en tu cuenta en 24–48h.
                </p>
                <button className="rm-btn-gold" onClick={() => handleClose(false)}>
                  Entendido
                </button>
              </div>
            )}

          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
