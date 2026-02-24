"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Newspaper,
  CalendarDays,
  Globe,
  ShieldCheck,
  Flame,
  TrendingUp,
  Users,
  Star,
} from "lucide-react"

interface BlogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const HIGHLIGHTS = [
  {
    icon: Flame,
    color: "text-orange-400",
    title: "Plataforma de nueva generación",
    desc: "Dados, apuestas en tiempo real y una interfaz diseñada para la mejor experiencia de juego online.",
  },
  {
    icon: ShieldCheck,
    color: "text-green-400",
    title: "Licencia oficial de Curaçao",
    desc: "Operamos bajo la licencia OGL/2024/687/0427 emitida por el Gobierno de Curaçao, garantizando un juego justo y seguro.",
  },
  {
    icon: TrendingUp,
    color: "text-blue-400",
    title: "Programa de afiliados",
    desc: "Gana el 1% de cada partida de tus referidos. El sistema de comisiones más competitivo del mercado.",
  },
  {
    icon: Users,
    color: "text-purple-400",
    title: "Club VIP exclusivo",
    desc: "Acceso por invitación a eventos privados, torneos exclusivos, agente dedicado y mucho más.",
  },
]

export function BlogModal({ open, onOpenChange }: BlogModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0e1a] border-border max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Blog LamaDice</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">

          {/* ── Hero ── */}
          <div
            className="relative flex flex-col items-center text-center px-8 pt-10 pb-8 overflow-hidden"
            style={{ background: "linear-gradient(180deg, #1a1535 0%, #0f0e1a 100%)" }}
          >
            {/* Decorative stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {["top-3 left-10", "top-6 right-14", "top-14 left-1/3", "top-5 right-1/4"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} text-purple-400 text-xs opacity-50`}>✦</div>
              ))}
            </div>

            {/* Badge */}
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-purple-500 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Newspaper className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-purple-400/30 animate-pulse" />
            </div>

            {/* Category tag */}
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full mb-4">
              Noticias oficiales
            </span>

            <h1 className="text-2xl font-black text-white leading-tight mb-3">
              LamaDice abre sus puertas oficialmente
            </h1>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
              <CalendarDays className="w-4 h-4 text-purple-400" />
              <span>25 de febrero de 2026</span>
            </div>

            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              La plataforma que redefinirá el entretenimiento online en Latinoamérica ya está aquí.
              Te contamos todo sobre este gran lanzamiento.
            </p>
          </div>

          {/* ── Articulo ── */}
          <div className="px-6 pb-6 space-y-5" style={{ background: "#0f0e1a" }}>

            {/* Intro */}
            <div className="bg-[#1a1535] rounded-xl p-5 border border-purple-800/30">
              <p className="text-sm text-gray-300 leading-relaxed">
                Hoy, <span className="text-white font-bold">25 de febrero de 2026</span>, marca un hito histórico:
                {" "}<span className="text-purple-400 font-bold">LamaDice</span> abre sus puertas al público de forma oficial.
                Lo que comenzó como un proyecto bajo el nombre <span className="text-gray-200 font-semibold">PeruBet</span> ha
                evolucionado hasta convertirse en una plataforma de juego de clase mundial, lista para competir
                con los mejores operadores del sector.
              </p>
            </div>

            {/* De PeruBet a LamaDice */}
            <div>
              <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                De PeruBet a LamaDice: el camino hasta aquí
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                El proyecto nació con una visión simple pero poderosa: ofrecer una experiencia de juego
                transparente, emocionante y accesible para todos. Bajo el nombre PeruBet, el equipo trabajó
                durante meses perfeccionando cada detalle de la plataforma, desde el motor de dados hasta
                el sistema de afiliados.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                El cambio de nombre a <span className="text-purple-400 font-semibold">LamaDice</span> representa
                la madurez del proyecto y su ambición de trascender fronteras. Un nombre más fuerte, una
                identidad más clara y una propuesta de valor que no tiene comparación en la región.
              </p>
            </div>

            {/* Highlights grid */}
            <div>
              <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                ¿Qué hace especial a LamaDice?
              </h2>
              <div className="space-y-3">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="flex items-start gap-3 bg-[#1a1535] rounded-xl p-4 border border-purple-800/30">
                    <h.icon className={`w-5 h-5 mt-0.5 shrink-0 ${h.color}`} />
                    <div>
                      <p className="text-sm font-bold text-white">{h.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 rounded-xl p-5 border border-purple-700/30">
              <h2 className="text-base font-black text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                El futuro que construimos juntos
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                En LamaDice creemos firmemente que la fama y el reconocimiento llegan cuando haces
                las cosas bien. Nos regulamos bajo los más altos estándares internacionales, operamos
                con total transparencia y ponemos al jugador en el centro de todo lo que hacemos.
                El camino apenas comienza, y el crecimiento que alcanzaremos será el resultado de
                la confianza que deposite en nosotros cada uno de nuestros jugadores.
              </p>
              <p className="text-sm text-gray-300 leading-relaxed mt-3">
                <span className="text-purple-300 font-semibold">Bienvenido a LamaDice.</span>{" "}
                Bienvenido al futuro del entretenimiento online en Latinoamérica.
              </p>
            </div>
          </div>

          {/* ── Licencia ── */}
          <div
            className="px-6 py-5 border-t border-gray-700/50 space-y-2"
            style={{ background: "#080714" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Globe className="w-4 h-4 text-gray-500 shrink-0" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Información de licencia</p>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              LamaDice.com es una marca comercial de Raw Entertainment B.V, Nº de registro 157205,
              con domicilio social en Korporaalweg 10, Curaçao, autorizada a realizar operaciones
              de juego en línea por el Gobierno de Curaçao con la licencia OGL/2024/687/0427.
              Raw Entertainment Ltd, Reg No HE421735, con domicilio social en Voukourestiou, 25,
              Neptune House, 1st Floor, Flat/Office11, Zakaki, 3045, Limassol, Chipre, es una
              Empresa del grupo LamaDice que actúa como agente de pagos y operaciones en nombre
              de Raw Entertainment B.V.
            </p>
            <p className="text-[11px] text-gray-600">
              18+ para jugar. El juego puede causar adicción. Juega con responsabilidad.
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
