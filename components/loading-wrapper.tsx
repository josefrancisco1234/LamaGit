"use client"

import * as React from "react"
import { LoadingScreen } from "@/components/loading-screen"

export function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const [showLoading, setShowLoading] = React.useState(true)
  const [fadingOut, setFadingOut] = React.useState(false)

  const handleComplete = React.useCallback(() => {
    // Iniciar fade-out
    setFadingOut(true)
    // Remover del DOM despues de la transicion (500ms)
    setTimeout(() => setShowLoading(false), 500)
  }, [])

  return (
    <>
      {showLoading && (
        <div
          style={{
            opacity: fadingOut ? 0 : 1,
            transition: "opacity 500ms ease-out",
            pointerEvents: fadingOut ? "none" : "auto",
          }}
        >
          <LoadingScreen onComplete={handleComplete} />
        </div>
      )}
      <div
        style={{
          opacity: showLoading ? 0 : 1,
          transition: showLoading ? "none" : "opacity 300ms ease-in",
        }}
      >
        {children}
      </div>
    </>
  )
}
