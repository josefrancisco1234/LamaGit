"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { setReferredBy } from "@/lib/affiliates"
import { getStoredReferralCode, clearStoredReferralCode } from "@/components/referral-banner"
import { Loader2, Mail, CheckCircle2, Eye, EyeOff, Check, X } from "lucide-react"

// ---------------------------------------------------------------------------
// DATOS GEOGRÁFICOS DE PERÚ
// ---------------------------------------------------------------------------
const PERU_PROVINCES: Record<string, string[]> = {
  'AMAZONAS': ['BAGUA', 'BONGARA', 'CHACHAPOYAS', 'CONDORCANQUI', 'LUYA', 'RODRIGUEZ DE MENDOZA', 'UTCUBAMBA'],
  'ANCASH': ['AIJA', 'ANTONIO RAIMONDI', 'ASUNCION', 'BOLOGNESI', 'CARHUAZ', 'CARLOS FERMIN FITZCARRALD', 'CASMA', 'CORONGO', 'HUARAZ', 'HUARI', 'HUARMEY', 'HUAYLAS', 'MARISCAL LUZURIAGA', 'OCROS', 'PALLASCA', 'POMABAMBA', 'RECUAY', 'SANTA', 'SIHUAS', 'YUNGAY'],
  'APURIMAC': ['ABANCAY', 'ANDAHUAYLAS', 'ANTABAMBA', 'AYMARAES', 'COTABAMBAS', 'CHINCHEROS', 'GRAU'],
  'AREQUIPA': ['AREQUIPA', 'CAMANA', 'CARAVELI', 'CASTILLA', 'CAYLLOMA', 'CONDESUYOS', 'ISLAY', 'LA UNION'],
  'AYACUCHO': ['HUAMANGA', 'CANGALLO', 'HUANCA SANCOS', 'HUANTA', 'LA MAR', 'LUCANAS', 'PARINACOCHAS', 'PAUCAR DEL SARA SARA', 'SUCRE', 'VICTOR FAJARDO', 'VILCAS HUAMAN'],
  'CAJAMARCA': ['CAJAMARCA', 'CAJABAMBA', 'CELENDIN', 'CHOTA', 'CONTUMAZA', 'CUTERVO', 'HUALGAYOC', 'JAEN', 'SAN IGNACIO', 'SAN MARCOS', 'SAN MIGUEL', 'SAN PABLO', 'SANTA CRUZ'],
  'CALLAO': ['CALLAO'],
  'CUSCO': ['CUSCO', 'ACOMAYO', 'ANTA', 'CALCA', 'CANAS', 'CANCHIS', 'CHUMBIVILCAS', 'ESPINAR', 'LA CONVENCION', 'PARURO', 'PAUCARTAMBO', 'QUISPICANCHI', 'URUBAMBA'],
  'HUANCAVELICA': ['HUANCAVELICA', 'ACOBAMBA', 'ANGARAES', 'CASTROVIRREYNA', 'CHURCAMPA', 'HUAYTARA', 'TAYACAJA'],
  'HUANUCO': ['HUANUCO', 'AMBO', 'DOS DE MAYO', 'HUACAYBAMBA', 'HUAMALIES', 'LEONCIO PRADO', 'MARANON', 'PACHITEA', 'PUERTO INCA', 'LAURICOCHA', 'YAROWILCA'],
  'ICA': ['ICA', 'CHINCHA', 'NAZCA', 'PALPA', 'PISCO'],
  'JUNIN': ['HUANCAYO', 'CHANCHAMAYO', 'CHUPACA', 'CONCEPCION', 'JUNIN', 'SATIPO', 'TARMA', 'YAULI'],
  'LA LIBERTAD': ['TRUJILLO', 'ASCOPE', 'BOLIVAR', 'CHEPEN', 'GRAN CHIMU', 'JULCAN', 'OTUZCO', 'PACASMAYO', 'PATAZ', 'SANCHEZ CARRION', 'SANTIAGO DE CHUCO', 'VIRU'],
  'LAMBAYEQUE': ['CHICLAYO', 'FERREÑAFE', 'LAMBAYEQUE'],
  'LIMA': ['LIMA', 'BARRANCA', 'CAJATAMBO', 'CANTA', 'CANETE', 'HUARAL', 'HUAROCHIRI', 'HUAURA', 'OYON', 'YAUYOS'],
  'LORETO': ['MAYNAS', 'ALTO AMAZONAS', 'DATEM DEL MARANON', 'LORETO', 'MARISCAL RAMON CASTILLA', 'PUTUMAYO', 'REQUENA', 'UCAYALI'],
  'MADRE DE DIOS': ['TAMBOPATA', 'MANU', 'TAHUAMANU'],
  'MOQUEGUA': ['MARISCAL NIETO', 'GENERAL SANCHEZ CERRO', 'ILO'],
  'PASCO': ['PASCO', 'DANIEL ALCIDES CARRION', 'OXAPAMPA'],
  'PIURA': ['PIURA', 'AYABACA', 'HUANCABAMBA', 'MORROPON', 'PAITA', 'SULLANA', 'TALARA', 'SECHURA'],
  'PUNO': ['PUNO', 'AZANGARO', 'CARABAYA', 'CHUCUITO', 'EL COLLAO', 'HUANCANE', 'LAMPA', 'MELGAR', 'MOHO', 'SAN ANTONIO DE PUTINA', 'SAN ROMAN', 'SANDIA', 'YUNGUYO'],
  'SAN MARTIN': ['MOYOBAMBA', 'BELLAVISTA', 'EL DORADO', 'HUALLAGA', 'LAMAS', 'MARISCAL CACERES', 'PICOTA', 'RIOJA', 'SAN MARTIN', 'TOCACHE'],
  'TACNA': ['TACNA', 'CANDARAVE', 'JORGE BASADRE', 'TARATA'],
  'TUMBES': ['TUMBES', 'CONTRALMIRANTE VILLAR', 'ZARUMILLA'],
  'UCAYALI': ['CORONEL PORTILLO', 'ATALAYA', 'PADRE ABAD', 'PURUS'],
}

const DEPARTMENTS = Object.keys(PERU_PROVINCES).sort()

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const DOC_TYPES = ['DNI', 'Pasaporte', 'Carnet de Extranjería', 'CE']

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const isValidPhone = (p: string) => /^\+?[0-9]{7,15}$/.test(p.replace(/\s/g, ''))

const getPwdReqs = (pwd: string) => [
  { text: 'Debe tener al menos 8 caracteres', ok: pwd.length >= 8 },
  { text: 'Contener al menos un número', ok: /[0-9]/.test(pwd) },
  { text: 'Contener al menos una letra mayúscula', ok: /[A-Z]/.test(pwd) },
  { text: 'Contener al menos una minúscula', ok: /[a-z]/.test(pwd) },
  { text: 'No use espacios', ok: pwd.length > 0 && !/\s/.test(pwd) },
]

// ---------------------------------------------------------------------------
// COMPONENTES AUXILIARES
// ---------------------------------------------------------------------------
function FieldRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-white/50">{label}</label>}
      {children}
    </div>
  )
}

function ValidatedInput({ value, onChange, placeholder, type = "text", valid, touched, disabled, rightEl }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string
  valid: boolean; touched: boolean; disabled?: boolean; rightEl?: React.ReactNode
}) {
  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="bg-secondary border-border pr-9"
        style={{ borderColor: touched ? (valid ? '#22c55e' : '#ef4444') : undefined }}
      />
      {touched && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {valid
            ? <Check className="w-4 h-4 text-green-500" />
            : <X className="w-4 h-4 text-red-500" />}
        </span>
      )}
      {rightEl && !touched && <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightEl}</span>}
    </div>
  )
}

function StyledSelect({ value, onChange, disabled, children }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-md text-sm bg-secondary border border-border text-foreground appearance-none"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
    >
      {children}
    </select>
  )
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {[1, 2, 3].map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: step >= s ? '#22c55e' : 'rgba(255,255,255,0.1)',
                color: step >= s ? '#fff' : 'rgba(255,255,255,0.4)',
                border: step === s ? '2px solid #22c55e' : '2px solid transparent',
              }}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
          </div>
          {i < 2 && (
            <div className="w-16 h-1 mx-1 rounded transition-all"
              style={{ background: step > s + 0 ? '#22c55e' : 'rgba(255,255,255,0.1)' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MODAL PRINCIPAL
// ---------------------------------------------------------------------------
interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = React.useState<"login" | "register">("login")
  const [step, setStep] = React.useState(1)

  // Login
  const [loginEmail, setLoginEmail] = React.useState("")
  const [loginPassword, setLoginPassword] = React.useState("")
  const [showLoginPwd, setShowLoginPwd] = React.useState(false)

  // Step 1: Personal
  const [firstName, setFirstName] = React.useState("")
  const [secondName, setSecondName] = React.useState("")
  const [firstSurname, setFirstSurname] = React.useState("")
  const [secondSurname, setSecondSurname] = React.useState("")
  const [docType, setDocType] = React.useState("DNI")
  const [docNumber, setDocNumber] = React.useState("")
  const [birthDay, setBirthDay] = React.useState("")
  const [birthMonth, setBirthMonth] = React.useState("")
  const [birthYear, setBirthYear] = React.useState("")

  // Step 2: Location
  const [address, setAddress] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [province, setProvince] = React.useState("")
  const [district, setDistrict] = React.useState("")
  const [postalCode, setPostalCode] = React.useState("")

  // Step 3: Contact
  const [phone, setPhone] = React.useState("+51 ")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPwd, setShowPwd] = React.useState(false)
  const [couponCode, setCouponCode] = React.useState("")
  const [wantsPromos, setWantsPromos] = React.useState(true)
  const [mincetur, setMincetur] = React.useState(true)
  const [notPep, setNotPep] = React.useState(true)

  // Touch tracking (para mostrar validación solo después de interacción)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (field: string) => setTouched(p => ({ ...p, [field]: true }))

  // Common
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [emailSent, setEmailSent] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState("")

  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  React.useEffect(() => {
    if (open) {
      const stored = getStoredReferralCode()
      if (stored) setCouponCode(stored)
    }
  }, [open])

  const resetForm = () => {
    setStep(1); setMode("login")
    setLoginEmail(""); setLoginPassword(""); setShowLoginPwd(false)
    setFirstName(""); setSecondName(""); setFirstSurname(""); setSecondSurname("")
    setDocType("DNI"); setDocNumber("")
    setBirthDay(""); setBirthMonth(""); setBirthYear("")
    setAddress(""); setDepartment(""); setProvince(""); setDistrict(""); setPostalCode("")
    setPhone("+51 "); setEmail(""); setPassword(""); setShowPwd(false); setCouponCode("")
    setWantsPromos(true); setMincetur(true); setNotPep(true)
    setTouched({})
    setLoading(false); setError(""); setEmailSent(false); setRegisteredEmail("")
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched({ loginEmail: true, loginPassword: true })
    if (!isValidEmail(loginEmail)) { setError("Email invalido"); return }
    if (loginPassword.length < 6) { setError("Contrasena muy corta"); return }
    setLoading(true)
    const { error } = await signIn(loginEmail, loginPassword)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      toast({ title: "Bienvenido a LamaDice!" })
      handleClose(false)
    }
  }

  // ---------------------------------------------------------------------------
  // REGISTRO - PASO 1
  // ---------------------------------------------------------------------------
  const handleStep1 = () => {
    setError("")
    setTouched(p => ({ ...p, firstName: true, firstSurname: true, secondSurname: true, docNumber: true, birth: true }))
    if (!firstName.trim()) { setError("Ingresa tu primer nombre"); return }
    if (!firstSurname.trim()) { setError("Ingresa tu primer apellido"); return }
    if (!secondSurname.trim()) { setError("Ingresa tu segundo apellido"); return }
    if (!docNumber.trim()) { setError("Ingresa tu numero de documento"); return }
    if (!birthDay || !birthMonth || !birthYear) { setError("Ingresa tu fecha de nacimiento completa"); return }
    const year = parseInt(birthYear)
    if (isNaN(year) || new Date().getFullYear() - year < 18) { setError("Debes ser mayor de 18 anos para registrarte"); return }
    setStep(2)
  }

  // ---------------------------------------------------------------------------
  // REGISTRO - PASO 2
  // ---------------------------------------------------------------------------
  const handleStep2 = () => {
    setError("")
    setTouched(p => ({ ...p, address: true, department: true, province: true }))
    if (!address.trim()) { setError("Ingresa tu direccion"); return }
    if (!department) { setError("Selecciona tu departamento"); return }
    if (!province) { setError("Selecciona tu provincia"); return }
    setStep(3)
  }

  // ---------------------------------------------------------------------------
  // REGISTRO - PASO 3 (SUBMIT FINAL)
  // ---------------------------------------------------------------------------
  const signUpWithId = async (email: string, password: string, username: string) => {
    const result = await signUp(email, password, username)
    if (result.error) return { error: result.error, userId: null }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched(p => ({ ...p, phone: true, email: true, password: true }))

    if (!isValidPhone(phone)) { setError("Telefono invalido. Solo números (7-15 dígitos), puede iniciar con +"); return }
    if (!isValidEmail(email)) { setError("Email invalido"); return }
    const pwdReqs = getPwdReqs(password)
    if (!pwdReqs.every(r => r.ok)) { setError("La contrasena no cumple todos los requisitos"); return }

    const username = (firstName + firstSurname).toLowerCase().replace(/[^a-z0-9]/g, '') + docNumber.slice(-4)

    setLoading(true)

    // Check username uniqueness
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
          setError("Ese usuario ya existe. Intenta con otro documento.")
          return
        }
      }
    } catch (e) {}

    const { error, userId } = await signUpWithId(email, password, username)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      if (couponCode.trim() && userId) {
        await setReferredBy(userId, couponCode.trim())
        clearStoredReferralCode()
      }
      setRegisteredEmail(email)
      setEmailSent(true)
    }
  }

  // ---------------------------------------------------------------------------
  // PANTALLA: CORREO ENVIADO
  // ---------------------------------------------------------------------------
  if (emailSent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-border max-w-md">
          <div className="flex flex-col items-center text-center py-6 gap-5">
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
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" style={{ color: "#f0b616" }}>Revisa tu correo</h2>
              <p className="text-base font-medium text-white">Te enviamos un link de confirmacion a:</p>
              <p className="text-sm font-bold px-4 py-2 rounded-lg"
                style={{ background: "rgba(240,182,22,0.1)", color: "#f0b616", border: "1px solid rgba(240,182,22,0.25)" }}>
                {registeredEmail}
              </p>
            </div>
            <div className="w-full rounded-xl p-4 space-y-2 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/80">1. Abre tu correo electronico</p>
              <p className="text-white/80">2. Busca el email de <strong>LamaDice</strong></p>
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

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header con tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => { setMode("login"); setError("") }}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{ color: mode === "login" ? "#f0b616" : "rgba(255,255,255,0.4)", borderBottom: mode === "login" ? "2px solid #f0b616" : "2px solid transparent" }}
          >
            Iniciar Sesion
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); setStep(1) }}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{ color: mode === "register" ? "#f0b616" : "rgba(255,255,255,0.4)", borderBottom: mode === "register" ? "2px solid #f0b616" : "2px solid transparent" }}
          >
            Registrarse
          </button>
        </div>

        {/* ================================================================ */}
        {/* LOGIN                                                             */}
        {/* ================================================================ */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <FieldRow label="Correo electronico">
              <ValidatedInput
                value={loginEmail}
                onChange={v => { setLoginEmail(v); touch("loginEmail") }}
                placeholder="tu@email.com"
                type="email"
                valid={isValidEmail(loginEmail)}
                touched={!!touched.loginEmail}
                disabled={loading}
              />
            </FieldRow>

            <FieldRow label="Contrasena">
              <div className="relative">
                <Input
                  type={showLoginPwd ? "text" : "password"}
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); touch("loginPassword") }}
                  placeholder="******"
                  disabled={loading}
                  className="bg-secondary border-border pr-10"
                />
                <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FieldRow>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button type="submit" className="w-full font-bold" disabled={loading}
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Iniciando...</> : "INICIAR SESION"}
            </Button>
          </form>
        )}

        {/* ================================================================ */}
        {/* REGISTRO                                                          */}
        {/* ================================================================ */}
        {mode === "register" && (
          <div>
            <ProgressBar step={step} />

            {/* ---- PASO 1: INFORMACIÓN PERSONAL ---- */}
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="text-center text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
                  Informacion Personal
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <FieldRow>
                    <ValidatedInput value={firstName} onChange={v => { setFirstName(v); touch("firstName") }}
                      placeholder="Primer nombre" valid={firstName.trim().length > 0}
                      touched={!!touched.firstName} disabled={loading} />
                  </FieldRow>
                  <FieldRow>
                    <ValidatedInput value={secondName} onChange={v => setSecondName(v)}
                      placeholder="Segundo nombre (opc.)" valid={true}
                      touched={false} disabled={loading} />
                  </FieldRow>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldRow>
                    <ValidatedInput value={firstSurname} onChange={v => { setFirstSurname(v); touch("firstSurname") }}
                      placeholder="Primer apellido" valid={firstSurname.trim().length > 0}
                      touched={!!touched.firstSurname} disabled={loading} />
                  </FieldRow>
                  <FieldRow>
                    <ValidatedInput value={secondSurname} onChange={v => { setSecondSurname(v); touch("secondSurname") }}
                      placeholder="Segundo apellido" valid={secondSurname.trim().length > 0}
                      touched={!!touched.secondSurname} disabled={loading} />
                  </FieldRow>
                </div>

                <FieldRow label="Documento de Identificacion">
                  <div className="grid grid-cols-2 gap-3">
                    <StyledSelect value={docType} onChange={v => setDocType(v)} disabled={loading}>
                      {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </StyledSelect>
                    <ValidatedInput value={docNumber} onChange={v => { setDocNumber(v); touch("docNumber") }}
                      placeholder="Numero" valid={docNumber.trim().length >= 6}
                      touched={!!touched.docNumber} disabled={loading} />
                  </div>
                </FieldRow>

                <FieldRow label="Fecha de Nacimiento">
                  <div className="grid grid-cols-3 gap-2">
                    <StyledSelect value={birthDay} onChange={v => { setBirthDay(v); touch("birth") }} disabled={loading}>
                      <option value="">Dia</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </StyledSelect>
                    <StyledSelect value={birthMonth} onChange={v => { setBirthMonth(v); touch("birth") }} disabled={loading}>
                      <option value="">Mes</option>
                      {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                    </StyledSelect>
                    <StyledSelect value={birthYear} onChange={v => { setBirthYear(v); touch("birth") }} disabled={loading}>
                      <option value="">Año</option>
                      {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </StyledSelect>
                  </div>
                </FieldRow>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <Button type="button" onClick={handleStep1} className="w-full font-bold mt-2"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                  SIGUIENTE
                </Button>
              </div>
            )}

            {/* ---- PASO 2: INFORMACIÓN DE LA CUENTA ---- */}
            {step === 2 && (
              <div className="space-y-3">
                <h3 className="text-center text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
                  Informacion de la Cuenta
                </h3>

                <FieldRow label="Pais de Nacimiento">
                  <StyledSelect value="Peru" onChange={() => {}} disabled>
                    <option>Peru</option>
                  </StyledSelect>
                </FieldRow>

                <FieldRow label="Pais de Residencia">
                  <StyledSelect value="Peru" onChange={() => {}} disabled>
                    <option>Peru</option>
                  </StyledSelect>
                </FieldRow>

                <FieldRow>
                  <ValidatedInput value={address} onChange={v => { setAddress(v); touch("address") }}
                    placeholder="Direccion (Ej: Av. Javier Prado 123)" valid={address.trim().length > 3}
                    touched={!!touched.address} disabled={loading} />
                </FieldRow>

                <FieldRow label="Departamento">
                  <StyledSelect value={department} onChange={v => { setDepartment(v); setProvince(""); touch("department") }} disabled={loading}>
                    <option value="">Selecciona departamento</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </StyledSelect>
                </FieldRow>

                <FieldRow label="Provincia">
                  <StyledSelect value={province} onChange={v => { setProvince(v); touch("province") }} disabled={loading || !department}>
                    <option value="">Selecciona provincia</option>
                    {(PERU_PROVINCES[department] || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </StyledSelect>
                </FieldRow>

                <FieldRow label="Distrito">
                  <Input
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="Escribe tu distrito"
                    disabled={loading}
                    className="bg-secondary border-border"
                  />
                </FieldRow>

                <FieldRow>
                  <ValidatedInput value={postalCode} onChange={v => setPostalCode(v)}
                    placeholder="Codigo Postal (opcional)" valid={true}
                    touched={false} disabled={loading} />
                </FieldRow>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" onClick={() => { setStep(1); setError("") }}
                    className="flex-1" variant="outline" disabled={loading}>
                    Atras
                  </Button>
                  <Button type="button" onClick={handleStep2} className="flex-1 font-bold"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                    SIGUIENTE
                  </Button>
                </div>
              </div>
            )}

            {/* ---- PASO 3: CONTACTO Y CUENTA ---- */}
            {step === 3 && (
              <form onSubmit={handleRegister} className="space-y-3">
                <h3 className="text-center text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
                  Datos de Contacto
                </h3>

                <FieldRow label="Telefono">
                  <div className="relative">
                    <ValidatedInput
                      value={phone}
                      onChange={v => { setPhone(v); touch("phone") }}
                      placeholder="+51 999999999"
                      valid={isValidPhone(phone)}
                      touched={!!touched.phone}
                      disabled={loading}
                    />
                    {touched.phone && !isValidPhone(phone) && (
                      <p className="text-xs text-red-400 mt-1">*Solo números (7-15 dígitos) y el carácter +</p>
                    )}
                  </div>
                </FieldRow>

                <FieldRow label="Correo electronico">
                  <ValidatedInput value={email} onChange={v => { setEmail(v); touch("email") }}
                    placeholder="tu@email.com" type="email"
                    valid={isValidEmail(email)} touched={!!touched.email} disabled={loading} />
                </FieldRow>

                <FieldRow label="Contrasena">
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); touch("password") }}
                      placeholder="Minimo 8 caracteres"
                      disabled={loading}
                      className="bg-secondary border-border pr-10"
                      style={{ borderColor: touched.password ? (getPwdReqs(password).every(r => r.ok) ? '#22c55e' : '#ef4444') : undefined }}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {getPwdReqs(password).map(r => (
                        <p key={r.text} className="text-xs flex items-center gap-1"
                          style={{ color: r.ok ? '#22c55e' : '#ef4444' }}>
                          {r.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {r.text}
                        </p>
                      ))}
                    </div>
                  )}
                </FieldRow>

                <FieldRow>
                  <button type="button" className="text-sm w-full text-left"
                    style={{ color: "#f0b616" }}
                    onClick={() => document.getElementById('coupon-input')?.focus()}>
                    ¿Tienes codigo de cupon? (opcional)
                  </button>
                  {couponCode || document.activeElement?.id === 'coupon-input' ? (
                    <Input
                      id="coupon-input"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="Codigo de cupon o referido"
                      disabled={loading}
                      className="bg-secondary border-border mt-1"
                    />
                  ) : (
                    <Input
                      id="coupon-input"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="Codigo de cupon o referido"
                      disabled={loading}
                      className="bg-secondary border-border mt-1"
                    />
                  )}
                </FieldRow>

                {/* Checkboxes */}
                <div className="space-y-2 pt-1">
                  {[
                    { state: wantsPromos, set: setWantsPromos, label: "Me gustaria obtener promociones" },
                    { state: mincetur, set: setMincetur, label: "El Licenciatario y/o MINCETUR podran monitorear la cuenta de usuario y la cuenta de juego" },
                    { state: notPep, set: setNotPep, label: "Declaro de manera voluntaria que no soy una Persona Expuesta Politicamente (PEP)" },
                  ].map(({ state, set, label }) => (
                    <div key={label} className="flex items-start gap-2 cursor-pointer select-none"
                      onClick={() => set(v => !v)}>
                      <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{ borderColor: state ? '#22c55e' : 'rgba(255,255,255,0.25)', background: state ? 'rgba(34,197,94,0.2)' : 'transparent' }}>
                        {state && <Check className="w-2.5 h-2.5 text-green-500" />}
                      </div>
                      <span className="text-xs text-white/60 leading-relaxed">{label}</span>
                    </div>
                  ))}
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <Button type="button" onClick={() => { setStep(2); setError("") }}
                    className="flex-1" variant="outline" disabled={loading}>
                    Atras
                  </Button>
                  <Button type="submit" className="flex-1 font-bold" disabled={loading}
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : "ABRIR CUENTA"}
                  </Button>
                </div>

                <p className="text-center text-xs text-white/30 flex items-center justify-center gap-1 pt-1">
                  🔒 100% REGISTRO SEGURO
                </p>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
