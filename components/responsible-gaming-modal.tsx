"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shield,
  Dice6,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  HeartHandshake,
} from "lucide-react"

interface ResponsibleGamingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TIPS = [
  { icon: Clock,         color: "text-blue-400",   title: "Establece límites de tiempo",    desc: "Decide cuánto tiempo vas a jugar antes de empezar y cúmplelo." },
  { icon: TrendingUp,    color: "text-green-400",  title: "Solo apuesta lo que puedes perder", desc: "Nunca apuestes dinero que necesitas para gastos esenciales." },
  { icon: Zap,           color: "text-yellow-400", title: "No persigas las pérdidas",       desc: "Si pierdes, no aumentes las apuestas para recuperar. Eso empeora la situación." },
  { icon: HeartHandshake,color: "text-purple-400", title: "Juega por diversión",            desc: "El juego es entretenimiento, no una fuente de ingresos." },
]

const WARNINGS = [
  "Apostar más de lo que puedes permitirte",
  "Jugar para escapar de problemas personales",
  "Mentir sobre cuánto tiempo o dinero juegas",
  "Descuidar trabajo, familia o responsabilidades",
  "Sentir ansiedad cuando no puedes jugar",
]

const FAQS = [
  {
    q: "¿Qué es el modo Demo?",
    a: "El modo Demo (apuesta S/ 0) te permite jugar exactamente igual que en el modo real, pero sin dinero real. Úsalo para aprender cómo funciona el juego sin ningún riesgo financiero.",
  },
  {
    q: "¿Se puede ganar dinero en LamaDice?",
    a: "Sí, es completamente posible ganar dinero en LamaDice y muchos jugadores lo hacen. Sin embargo, al tener un edge del 1% a favor de la casa, es inevitable que a muy largo plazo la casa recupere un porcentaje de lo apostado. Esto no significa que no puedas irte con ganancias: una buena racha, una apuesta bien calculada o retirarte en el momento correcto son estrategias totalmente válidas. Juega con cabeza y disfruta el proceso.",
  },
]

export function ResponsibleGamingModal({ open, onOpenChange }: ResponsibleGamingModalProps) {
  const [demoThreshold, setDemoThreshold] = React.useState(50)
  const [demoBet, setDemoBet] = React.useState(10)
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

  const multiplier = Number((99 / demoThreshold).toFixed(2))
  const winChance = demoThreshold
  const potentialWin = Number((demoBet * multiplier).toFixed(2))
  const profit = Number((potentialWin - demoBet).toFixed(2))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0e1a] border-border max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Juego Responsable</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">

          {/* ── Hero ── */}
          <div
            className="relative flex flex-col items-center text-center px-8 pt-10 pb-8 overflow-hidden"
            style={{ background: "linear-gradient(180deg, #0d2010 0%, #0f0e1a 100%)" }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {["top-3 left-10", "top-7 right-14", "top-16 left-1/3", "top-5 right-1/4"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} text-green-500 text-xs opacity-40`}>✦</div>
              ))}
            </div>

            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-500 to-green-800 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-green-400/30 animate-pulse" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full mb-4">
              Juego Responsable
            </span>
            <h1 className="text-2xl font-black text-white leading-tight mb-3">
              Entiende el juego antes de apostar
            </h1>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              En LamaDice nos importa que juegues de forma informada y segura.
              Aquí te explicamos exactamente cómo funciona nuestro juego de dados.
            </p>
          </div>

          {/* ── Cómo funciona el dado ── */}
          <div className="px-6 pb-6 space-y-5" style={{ background: "#0f0e1a" }}>
            <div>
              <h2 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                <Dice6 className="w-5 h-5 text-green-400" />
                ¿Cómo funciona el juego de dados?
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                El juego genera un número aleatorio entre 0 y 100. Tú eliges un umbral y ganas si el número cae por debajo.
              </p>

              {/* Visual de la barra 0-100 */}
              <div className="bg-[#1a1535] rounded-xl p-5 border border-purple-800/30 space-y-4">
                <div className="flex justify-between text-xs text-gray-500 font-mono mb-1">
                  <span>0</span>
                  <span className="text-green-400 font-bold">Umbral: {demoThreshold}</span>
                  <span>100</span>
                </div>

                {/* Barra visual */}
                <div className="relative h-9 rounded-lg overflow-hidden" style={{ background: "rgba(239,68,68,0.15)" }}>
                  {/* Zona ganadora */}
                  <div
                    className="absolute left-0 top-0 bottom-0 flex items-center justify-center transition-all duration-300"
                    style={{
                      width: `${demoThreshold}%`,
                      background: "linear-gradient(90deg, rgba(34,197,94,0.35), rgba(34,197,94,0.2))",
                      borderRight: "2px dashed rgba(34,197,94,0.8)",
                    }}
                  >
                    {demoThreshold >= 20 && (
                      <span className="text-green-400 text-xs font-bold">✓ GANAS</span>
                    )}
                  </div>
                  {/* Zona perdedora */}
                  <div
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
                    style={{ width: `${100 - demoThreshold}%` }}
                  >
                    {(100 - demoThreshold) >= 15 && (
                      <span className="text-red-400 text-xs font-bold">✗ PIERDES</span>
                    )}
                  </div>
                </div>

                {/* Slider del umbral */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Mueve el umbral para ver cómo cambia</label>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    step={5}
                    value={demoThreshold}
                    onChange={(e) => setDemoThreshold(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                </div>

                {/* Stats de la barra */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                    <p className="text-green-400 text-lg font-black">{winChance}%</p>
                    <p className="text-xs text-gray-500">Prob. de ganar</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
                    <p className="text-purple-300 text-lg font-black">{multiplier}x</p>
                    <p className="text-xs text-gray-500">Multiplicador</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                    <p className="text-red-400 text-lg font-black">{100 - winChance}%</p>
                    <p className="text-xs text-gray-500">Prob. de perder</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Calculadora de ganancia ── */}
            <div>
              <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Simulador de apuesta
              </h2>
              <div className="bg-[#1a1535] rounded-xl p-5 border border-blue-800/30 space-y-4">

                {/* Input de apuesta */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Monto de apuesta (S/)</label>
                  <div className="flex gap-2">
                    {[1, 5, 10, 50].map((v) => (
                      <button
                        key={v}
                        onClick={() => setDemoBet(v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          demoBet === v
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        S/{v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resultado visual */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-xs text-gray-500">Apostado</p>
                    <p className="text-xl font-black text-white">S/ {demoBet.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-xs text-gray-500">Si ganas recibres</p>
                    <p className="text-xl font-black text-green-400">S/ {potentialWin}</p>
                  </div>
                </div>

                {/* Fórmula */}
                <div className="flex items-center justify-center gap-2 text-sm font-mono flex-wrap">
                  <span className="bg-white/5 px-2 py-1 rounded text-white">S/ {demoBet}</span>
                  <span className="text-gray-500">×</span>
                  <span className="bg-purple-500/20 px-2 py-1 rounded text-purple-300">{multiplier}x</span>
                  <span className="text-gray-500">=</span>
                  <span className="bg-green-500/20 px-2 py-1 rounded text-green-400">S/ {potentialWin}</span>
                  <span className="text-gray-600 text-xs ml-1">(+S/ {profit} ganancia)</span>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Fórmula: apuesta × (99 ÷ umbral) — La casa retiene el 1%
                </p>
              </div>
            </div>

            {/* ── Ventaja de casa ── */}
            <div className="bg-[#1a1535] rounded-xl p-5 border border-yellow-800/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white mb-1">La ventaja de la casa: 1%</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    El dado puede caer entre <span className="text-white font-bold">0.00 y 100.00</span>.
                    El umbral máximo es <span className="text-yellow-400 font-bold">98.02</span>.
                    Esto significa que si el dado cae entre 98.03 y 100 (~2% de casos), el jugador <span className="text-red-400 font-bold">siempre pierde</span>, sin importar el umbral elegido.
                    Además, el multiplicador usa factor 99 en lugar de 100, lo que genera un margen del 1%.
                    <span className="text-yellow-400 font-semibold"> A largo plazo, la casa siempre tiene ventaja matemática.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Consejos ── */}
          <div className="px-6 pb-6" style={{ background: "#13122a" }}>
            <div className="py-4">
              <h2 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Consejos para jugar responsablemente
              </h2>
              <p className="text-xs text-gray-500 mb-4">Sigue estas pautas para mantener el juego como diversión.</p>
              <div className="space-y-3">
                {TIPS.map((tip) => (
                  <div key={tip.title} className="flex items-start gap-3 bg-[#1a1535] rounded-xl p-4 border border-purple-800/30">
                    <tip.icon className={`w-5 h-5 mt-0.5 shrink-0 ${tip.color}`} />
                    <div>
                      <p className="text-sm font-bold text-white">{tip.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Señales de alerta */}
            <div className="bg-red-950/30 rounded-xl p-5 border border-red-800/30 mt-2">
              <h3 className="text-sm font-black text-red-400 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Señales de alerta
              </h3>
              <ul className="space-y-2">
                {WARNINGS.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                    {w}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                Si reconoces alguna de estas señales, considera hacer una pausa y buscar ayuda en{" "}
                <span className="text-blue-400 font-semibold">jugadoresanonimos.org</span>
              </p>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="px-6 pb-6" style={{ background: "#0f0e1a" }}>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Preguntas frecuentes
            </h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-gray-700/50 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-semibold text-white pr-4">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    }
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 border-t border-gray-700/50">
                      <p className="text-xs text-gray-400 leading-relaxed mt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="px-6 py-4 border-t border-gray-700/50 text-center"
            style={{ background: "#080714" }}
          >
            <p className="text-xs text-gray-600">
              LamaDice promueve el juego responsable. 18+ para jugar. Si tienes problemas con el juego,
              busca ayuda profesional.
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
