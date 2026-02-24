"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { setReferredBy } from "@/lib/affiliates"
import { getStoredReferralCode, clearStoredReferralCode } from "@/components/referral-banner"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = React.useState<"login" | "register">("login")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [referralCode, setReferralCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [emailSent, setEmailSent] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState("")

  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  // Auto-fill referral code from URL (?ref=xxx) if stored
  React.useEffect(() => {
    if (open) {
      const stored = getStoredReferralCode()
      if (stored) setReferralCode(stored)
    }
  }, [open])

  // Wrapper that also returns userId for referral linking
  const signUpWithId = async (email: string, password: string, username: string) => {
    const result = await signUp(email, password, username)
    if (result.error) return { error: result.error, userId: null }
    // Get userId from localStorage after signup
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { error: null, userId: parsed?.user?.id ?? null }
      }
    } catch (e) {}
    return { error: null, userId: null }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setUsername("")
    setReferralCode("")
    setError("")
    setTermsAccepted(false)
    setEmailSent(false)
    setRegisteredEmail("")
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateEmail(email)) {
      setError("Email invalido")
      return
    }

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Bienvenido!",
        description: "Has iniciado sesion correctamente",
      })
      handleClose(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres")
      return
    }

    if (!validateEmail(email)) {
      setError("Email invalido")
      return
    }

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres")
      return
    }

    if (!termsAccepted) {
      setError("Debes aceptar los terminos y condiciones para continuar")
      return
    }

    setLoading(true)

    // Check username uniqueness before signing up
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?username=ilike.${encodeURIComponent(username)}&select=id`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      )
      if (checkRes.ok) {
        const existing = await checkRes.json()
        if (existing?.length > 0) {
          setLoading(false)
          setError("Ese nombre de usuario ya esta en uso. Elige otro.")
          return
        }
      }
    } catch (e) { /* continue if check fails */ }

    const { error, userId } = await signUpWithId(email, password, username)
    setLoading(false)

    if (error) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      // Save referral code if provided
      if (referralCode.trim() && userId) {
        await setReferredBy(userId, referralCode.trim())
        clearStoredReferralCode()
      }
      setRegisteredEmail(email)
      setEmailSent(true)
    }
  }

  // Pantalla de confirmación de email
  if (emailSent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-border max-w-md">
          <div className="flex flex-col items-center text-center py-6 gap-5">
            {/* Ícono animado */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "rgba(240,182,22,0.1)", border: "2px solid rgba(240,182,22,0.3)" }}>
                <Mail className="w-12 h-12" style={{ color: "#f0b616" }} />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#22c55e" }}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Texto principal */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" style={{ color: "#f0b616" }}>
                Revisa tu correo
              </h2>
              <p className="text-base font-medium text-white">
                Te enviamos un link de confirmacion a:
              </p>
              <p className="text-sm font-bold px-4 py-2 rounded-lg"
                style={{ background: "rgba(240,182,22,0.1)", color: "#f0b616", border: "1px solid rgba(240,182,22,0.25)" }}>
                {registeredEmail}
              </p>
            </div>

            {/* Instrucciones */}
            <div className="w-full rounded-xl p-4 space-y-2 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/80">1. Abre tu correo electronico</p>
              <p className="text-white/80">2. Busca el email de <strong>LamaBet</strong></p>
              <p className="text-white/80">3. Haz clic en el enlace de confirmacion</p>
              <p className="text-yellow-400/70 text-xs mt-2">⚠️ Revisa la carpeta de Spam si no lo encuentras</p>
            </div>

            <Button className="w-full mt-2" onClick={() => handleClose(false)}
              style={{ background: "linear-gradient(135deg, #f0b616, #d4920a)", color: "#0a0f1a", fontWeight: 700 }}>
              Entendido, ire a revisar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Bienvenido a LamaBet
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "login" | "register")
            setError("")
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="login">Iniciar Sesion</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Contrasena</label>
                <Input
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  "Iniciar Sesion"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Nombre de Usuario
                </label>
                <Input
                  type="text"
                  placeholder="tunombre"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Contrasena</label>
                <Input
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Codigo de referido <span className="text-xs opacity-60">(opcional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ej: juanperez"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={loading}
                />
              </div>

              {/* Checkbox 18+ y términos */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div
                    onClick={() => !loading && setTermsAccepted(v => !v)}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: termsAccepted ? "#f0b616" : "rgba(255,255,255,0.2)",
                      background: termsAccepted ? "rgba(240,182,22,0.15)" : "transparent",
                    }}
                  >
                    {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#f0b616" }} />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Confirmo que soy <span style={{ color: "#f0b616", fontWeight: 700 }}>mayor de 18 anos</span>, estoy comprometido con el{" "}
                  <span style={{ color: "#f0b616", fontWeight: 700 }}>juego justo</span> y acepto los{" "}
                  <span style={{ color: "#f0b616", fontWeight: 700 }}>Terminos y Condiciones</span> de LamaBet.
                </span>
              </label>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !termsAccepted}
                style={termsAccepted ? {} : { opacity: 0.5 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
