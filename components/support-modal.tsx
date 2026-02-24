"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MessageCircle, Phone, Clock, CheckCircle, ExternalLink } from "lucide-react"

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WA_NUMBER = "17869392784"
const WA_DISPLAY = "+1 (786) 939-2784"
const WA_URL = `https://wa.me/${WA_NUMBER}?text=Hola%2C%20necesito%20ayuda%20con%20LamaDice`

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  return (
    <>
      <style>{`
        .sp-content {
          background: linear-gradient(160deg, #0d1b3e 0%, #111827 50%, #0a1020 100%);
          border: 1px solid rgba(37,211,102,0.25) !important;
          border-radius: 20px !important;
          box-shadow: 0 0 60px rgba(37,211,102,0.08), 0 25px 60px rgba(0,0,0,0.6) !important;
          overflow: hidden;
        }
        .sp-content > button {
          z-index: 30 !important;
          color: rgba(255,255,255,0.8) !important;
          opacity: 1 !important;
        }
        .sp-content > button:hover {
          color: #25d366 !important;
          background: rgba(37,211,102,0.12) !important;
          border-radius: 50%;
        }
        .sp-wa-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #25d366 0%, #128c4a 50%, #25d366 100%);
          background-size: 200% 200%;
          color: #fff;
          letter-spacing: 0.02em;
          transition: all 0.25s ease;
          box-shadow: 0 4px 24px rgba(37,211,102,0.35);
          text-decoration: none;
        }
        .sp-wa-btn:hover {
          background-position: right center;
          box-shadow: 0 0 36px rgba(37,211,102,0.55), 0 4px 20px rgba(37,211,102,0.4);
          transform: translateY(-2px);
        }
        .sp-wa-btn:active {
          transform: translateY(0px);
        }
        .sp-info-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
        }
        @keyframes sp-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sp-content max-w-md p-0 gap-0">
          <div className="relative z-10 p-6">

            <DialogHeader className="pb-5">
              {/* Hero icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {/* Anillo pulsante */}
                  <div style={{
                    position: "absolute", inset: "-8px", borderRadius: "50%",
                    border: "2px solid rgba(37,211,102,0.4)",
                    animation: "sp-pulse-ring 2s ease-out infinite",
                  }} />
                  <div style={{
                    width: "72px", height: "72px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(37,211,102,0.2) 0%, rgba(18,140,74,0.3) 100%)",
                    border: "1px solid rgba(37,211,102,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 30px rgba(37,211,102,0.2)",
                  }}>
                    <MessageCircle className="w-8 h-8" style={{ color: "#25d366" }} />
                  </div>
                </div>
              </div>

              <DialogTitle className="text-center text-2xl font-black" style={{ color: "#25d366", letterSpacing: "0.04em" }}>
                Soporte en Vivo
              </DialogTitle>
              <p className="text-center text-sm mt-1" style={{ color: "#64748b" }}>
                ¿Tienes alguna duda o problema? Estamos aquí para ayudarte.
              </p>
            </DialogHeader>

            <div className="space-y-4">

              {/* Status badge */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Agentes disponibles
                </div>
              </div>

              {/* Info cards */}
              <div className="space-y-2">
                <div className="sp-info-card">
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                    background: "rgba(37,211,102,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Phone className="w-4 h-4" style={{ color: "#25d366" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#64748b" }}>Número oficial de LamaDice</p>
                    <p className="font-bold text-sm" style={{ color: "#e2e8f0" }}>{WA_DISPLAY}</p>
                  </div>
                </div>

                <div className="sp-info-card">
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                    background: "rgba(37,211,102,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Clock className="w-4 h-4" style={{ color: "#25d366" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#64748b" }}>Horario de atención</p>
                    <p className="font-bold text-sm" style={{ color: "#e2e8f0" }}>Lunes a Domingo · 8am – 11pm</p>
                  </div>
                </div>

                <div className="sp-info-card">
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                    background: "rgba(37,211,102,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckCircle className="w-4 h-4" style={{ color: "#25d366" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#64748b" }}>Tiempo de respuesta</p>
                    <p className="font-bold text-sm" style={{ color: "#e2e8f0" }}>Menos de 5 minutos</p>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sp-wa-btn"
              >
                {/* WhatsApp SVG icon */}
                <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor">
                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.663 4.61 1.806 6.51L4 29l7.686-1.786A12.93 12.93 0 0 0 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 2c5.523 0 10 4.477 10 10S21.523 26 16 26c-1.924 0-3.72-.547-5.25-1.492l-.37-.23-4.562 1.06 1.094-4.46-.244-.383A9.953 9.953 0 0 1 6 15c0-5.523 4.477-10 10-10zm-2.834 5.5c-.21 0-.551.08-.84.39-.289.311-1.1 1.074-1.1 2.62 0 1.546 1.124 3.038 1.28 3.248.156.21 2.2 3.358 5.337 4.578 2.638 1.025 3.175.821 3.748.77.572-.052 1.847-.756 2.108-1.487.26-.73.26-1.356.183-1.487-.078-.13-.286-.208-.6-.364-.313-.156-1.847-.912-2.134-1.014-.286-.104-.495-.156-.703.156-.208.312-.806 1.015-.987 1.223-.18.208-.363.234-.677.078-.312-.156-1.32-.487-2.513-1.552-.93-.829-1.558-1.852-1.74-2.165-.183-.312-.02-.48.137-.635.14-.14.312-.364.468-.547.156-.182.208-.312.312-.52.104-.208.052-.39-.026-.547-.077-.156-.694-1.713-.974-2.327-.26-.591-.524-.495-.703-.495z"/>
                </svg>
                Chatear por WhatsApp
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>

              <p className="text-xs text-center" style={{ color: "#475569" }}>
                Al hacer clic serás redirigido a WhatsApp. Solo contáctanos desde el número oficial.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
