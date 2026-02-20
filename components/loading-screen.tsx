"use client"

import * as React from "react"

interface LamaBetLoadingProps {
  imageSrc?: string
  title?: string
  onComplete?: () => void
}

const CUBE = 160 // px - tamaño de cada cara del dado
const HALF = CUBE / 2

// Las 6 caras del dado con sus transformaciones 3D
const FACES = [
  { id: "front",  transform: `rotateY(0deg)    translateZ(${HALF}px)` },
  { id: "back",   transform: `rotateY(180deg)  translateZ(${HALF}px)` },
  { id: "right",  transform: `rotateY(90deg)   translateZ(${HALF}px)` },
  { id: "left",   transform: `rotateY(-90deg)  translateZ(${HALF}px)` },
  { id: "top",    transform: `rotateX(90deg)   translateZ(${HALF}px)` },
  { id: "bottom", transform: `rotateX(-90deg)  translateZ(${HALF}px)` },
]

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

        /* Escena 3D - perspectiva aplicada al padre del dado */
        .lb-scene {
          perspective: 600px;
          width: ${CUBE}px;
          height: ${CUBE}px;
        }

        /* El dado gira en los 3 ejes para mostrar todas las caras */
        .lb-dice {
          width: ${CUBE}px;
          height: ${CUBE}px;
          position: relative;
          transform-style: preserve-3d;
          animation: lb-roll 4s linear infinite;
        }

        @keyframes lb-roll {
          0%   { transform: rotateX(0deg)   rotateY(0deg); }
          25%  { transform: rotateX(90deg)  rotateY(180deg); }
          50%  { transform: rotateX(180deg) rotateY(360deg); }
          75%  { transform: rotateX(270deg) rotateY(540deg); }
          100% { transform: rotateX(360deg) rotateY(720deg); }
        }

        /* Cada cara del dado */
        .lb-face {
          position: absolute;
          width: ${CUBE}px;
          height: ${CUBE}px;
          border: 3px solid #f0b616;
          border-radius: 18px;
          overflow: hidden;
          backface-visibility: hidden;
          background: #1a2040;
          box-shadow: inset 0 0 20px rgba(240, 182, 22, 0.12);
        }

        .lb-face img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Anillo expansivo alrededor del dado */
        .lb-pulse-ring {
          animation: lb-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes lb-ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#1a2040" }}
      >
        {/* Contenedor del dado con glow */}
        <div
          className="relative flex items-center justify-center mb-10"
          style={{ width: "220px", height: "220px", marginTop: "2.5rem" }}
        >
          {/* Aura de luz difusa */}
          <div
            className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
            style={{
              background: "rgba(240, 182, 22, 0.22)",
              filter: "blur(55px)",
            }}
          />

          {/* Anillo expansivo */}
          <div
            className="absolute lb-pulse-ring pointer-events-none"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "rgba(240, 182, 22, 0.15)",
            }}
          />

          {/* Escena 3D */}
          <div className="lb-scene">
            <div className="lb-dice">
              {FACES.map((face) => (
                <div
                  key={face.id}
                  className="lb-face"
                  style={{ transform: face.transform }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="LamaBet" />
                </div>
              ))}
            </div>
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
