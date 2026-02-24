"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Crown,
  Trophy,
  Zap,
  Gift,
  UserCheck,
  TrendingUp,
  Star,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react"

interface VipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BENEFITS = [
  {
    icon: "🥂",
    title: "Eventos VIP en vivo",
    desc: "Invitaciones a eventos privados solo para VIP por todo el mundo.",
  },
  {
    icon: "🏆",
    title: "Torneos exclusivos",
    desc: "Compite al más alto nivel con otros VIP.",
  },
  {
    icon: "🎰",
    title: "Giros gratis",
    desc: "Despiértate con sorpresas como giros gratis, créditos y regalos.",
  },
  {
    icon: "🎯",
    title: "Agente dedicado",
    desc: "Asistencia personalizada para una experiencia de juego premium.",
  },
  {
    icon: "💰",
    title: "Lossback",
    desc: "Encuentra tranquilidad con descuentos adicionales en pérdidas elegibles.",
  },
  {
    icon: "⚡",
    title: "Aumento del rakeback",
    desc: "Maximiza tus ganancias con recompensas mejoradas en cada apuesta.",
  },
]

const CRITERIA = [
  {
    icon: Star,
    color: "text-yellow-400",
    title: "Lealtad",
    desc: "Tu lealtad aumenta tus posibilidades de alcanzar el estatus VIP.",
  },
  {
    icon: Activity,
    color: "text-yellow-400",
    title: "Actividad",
    desc: "Un compromiso constante y responsable con LamaDice aumenta las probabilidades de ser reconocido como jugador valioso.",
  },
  {
    icon: Layers,
    color: "text-yellow-400",
    title: "Variedad",
    desc: "Participar activamente en el juego de dados y utilizar nuestra variedad de funciones puede aumentar tus chances.",
  },
]

const FAQS = [
  {
    q: "Criterios de afiliación y servicios exclusivos del Club LamaDice VIP",
    a: "Para mantener la exclusividad y un nivel excepcional de servicios, el Club LamaDice VIP es estrictamente solo por invitación. Los jugadores que cumplan con nuestros criterios serán contactados por un miembro dedicado de nuestro equipo VIP.",
  },
  {
    q: "¿Qué criterios específicos se deben cumplir para ser miembro del programa LamaDice VIP?",
    a: "Se tiene en cuenta toda la actividad de juego, incluyendo la frecuencia, el volumen apostado y el tiempo en la plataforma. Sobre todo, valoramos la fidelidad y el juego responsable.",
  },
  {
    q: "¿Es necesario que proporcione información adicional para ser miembro VIP?",
    a: "Puede que te preguntemos cuáles son tus preferencias en materia de hospitalidad o si tienes algún pasatiempo o hobby, pero solo porque nuestro equipo VIP se esfuerza al máximo para recompensarte.",
  },
  {
    q: "¿Qué distingue al Club LamaDice VIP de los demás y lo convierte en una opción superior?",
    a: "Nos comprometemos a proporcionar la mejor experiencia posible a nuestros clientes VIP. Ofrecemos un equipo VIP dedicado, promociones exclusivas y un trato personalizado que no encontrarás en ningún otro sitio.\n\nLa honestidad, la atención al detalle y la integridad son las señas de identidad del programa LamaDice VIP.\n\nLos miembros de nuestro club VIP reciben un servicio rápido y excepcional que no tiene comparación. Estamos seguros de que, una vez que te conviertas en miembro de nuestro club VIP, no querrás dejarlo.",
  },
]

export function VipModal({ open, onOpenChange }: VipModalProps) {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0e1a] border-border max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Club VIP LamaDice</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {/* ── Hero ── */}
          <div
            className="relative flex flex-col items-center text-center px-8 pt-10 pb-8 overflow-hidden"
            style={{ background: "linear-gradient(180deg, #1a1535 0%, #0f0e1a 100%)" }}
          >
            {/* Stars decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {["top-4 left-12", "top-8 right-16", "top-16 left-1/4", "top-6 right-1/3"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} text-yellow-300 text-xs opacity-60`}>✦</div>
              ))}
            </div>

            {/* Crown badge */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-yellow-400/30 animate-pulse" />
            </div>

            <h1 className="text-2xl font-black text-white leading-tight mb-3">
              ¡Vive la experiencia más gratificante<br />
              como <span className="text-yellow-400">miembro del club VIP</span>!
            </h1>
            <p className="text-sm text-gray-400 max-w-md">
              El club VIP más gratificante del sector, que ofrece ventajas sin igual y privilegios
              exclusivos para disfrutar de una experiencia de juego extraordinaria.
            </p>
          </div>

          {/* ── Ventajas VIP ── */}
          <div className="px-6 pb-6" style={{ background: "#0f0e1a" }}>
            <div className="text-center mb-5">
              <h2 className="text-xl font-black text-white">
                Explorar <span className="text-yellow-400">Ventajas VIP</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                ¡Disfruta de un servicio excepcional y de increíbles recompensas con el Club LamaDice VIP!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="bg-[#1a1535] rounded-xl p-4 text-center border border-purple-800/30 hover:border-yellow-500/30 transition-colors"
                >
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <p className="text-xs font-bold text-white mb-1">{b.title}</p>
                  <p className="text-[11px] text-gray-400 leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cómo conseguirlo ── */}
          <div className="px-6 pb-6" style={{ background: "#13122a" }}>
            <div className="text-center py-5">
              <h2 className="text-xl font-black text-white leading-snug">
                Juega más para conseguir una<br />
                invitación exclusiva al{" "}
                <span className="text-yellow-400">Club VIP.</span>
              </h2>
              <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
                Aumenta tu actividad para incrementar las posibilidades de conseguir una
                invitación VIP exclusiva y desbloquear un mundo de ventajas y privilegios premium.
              </p>
            </div>

            <div className="space-y-3">
              {CRITERIA.map((c) => (
                <div key={c.title} className="flex items-start gap-3 bg-[#1a1535] rounded-xl p-4 border border-purple-800/30">
                  <c.icon className={`w-5 h-5 mt-0.5 shrink-0 ${c.color}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="px-6 pb-6" style={{ background: "#0f0e1a" }}>
            <h2 className="text-lg font-black text-white mb-4">Preguntas Frecuentes</h2>
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
                      {faq.a.split('\n\n').map((para, j) => (
                        <p key={j} className="text-xs text-gray-400 leading-relaxed mt-3">{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Contacto ── */}
          <div
            className="px-6 py-5 flex items-center justify-center gap-2 text-center border-t border-gray-700/50"
            style={{ background: "#0f0e1a" }}
          >
            <Mail className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-sm text-gray-400">
              Si deseas más información contactar por{" "}
              <a
                href="https://wa.me/17869392784"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 font-semibold hover:underline"
              >
                WhatsApp +1 (786) 939-2784
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
