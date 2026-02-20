"use client"

import * as React from "react"

interface LamaBetLoadingProps {
  imageSrc?: string
  title?: string
  onComplete?: () => void
}

export function LoadingScreen({
  imageSrc = "/logo.png",
  title = "LamaBet",
  onComplete,
}: LamaBetLoadingProps) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          onComplete?.()
          return 100
        }
        return Math.min(prev + Math.floor(Math.random() * 15) + 5, 100)
      })
    }, 300)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');

        .lb-font {
          font-family: 'Montserrat', sans-serif;
        }

        .lb-glow-gold {
          text-shadow: 0 0 15px rgba(240, 182, 22, 0.6), 0 0 30px rgba(240, 182, 22, 0.3);
        }

        .lb-chip-spin {
          animation: lb-spin 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes lb-spin {
          0%   { transform: rotateY(0deg) scale(1); }
          50%  { transform: rotateY(180deg) scale(1.05); }
          100% { transform: rotateY(360deg) scale(1); }
        }

        .lb-pulse-ring {
          animation: lb-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes lb-ping {
          75%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#1a2040" }}
      >
        {/* Ficha giratoria */}
        <div className="relative mb-8 mt-10" style={{ perspective: "1000px" }}>
          {/* Aura de luz */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: "rgba(240, 182, 22, 0.3)",
              filter: "blur(50px)",
              transform: "scale(1.25)",
            }}
          />
          {/* Anillo expansivo */}
          <div
            className="absolute inset-0 rounded-full lb-pulse-ring pointer-events-none"
            style={{ background: "rgba(240, 182, 22, 0.2)" }}
          />

          {/* Ficha */}
          <div
            className="relative lb-chip-spin overflow-hidden"
            style={{
              width: "192px",
              height: "192px",
              borderRadius: "50%",
              border: "4px solid #f0b616",
              boxShadow: "0 0 50px rgba(240, 182, 22, 0.4)",
              background: "#1a2040",
              transformStyle: "preserve-3d",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={`${title} Logo`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Reflejo de brillo */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top right, transparent, rgba(255,255,255,0.2), transparent)",
              }}
            />
          </div>
        </div>

        {/* Titulo */}
        <h1
          className="lb-font lb-glow-gold uppercase mb-8"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 900,
            letterSpacing: "0.15em",
            color: "#f0b616",
          }}
        >
          {title}
        </h1>

        {/* Barra de progreso */}
        <div
          style={{
            width: "min(384px, 80vw)",
            height: "8px",
            borderRadius: "9999px",
            overflow: "hidden",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(240, 182, 22, 0.2)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(progress, 100)}%`,
              background:
                "linear-gradient(to right, rgba(240,182,22,0.5), #f0b616, #fff3c4)",
              transition: "width 300ms ease-out",
              borderRadius: "9999px",
            }}
          />
        </div>

        {/* Porcentaje */}
        <p
          className="lb-font"
          style={{
            marginTop: "1rem",
            color: "rgba(240, 182, 22, 0.9)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            fontSize: "clamp(0.75rem, 2vw, 1rem)",
          }}
        >
          CARGANDO... {Math.min(progress, 100)}%
        </p>
      </div>
    </>
  )
}
