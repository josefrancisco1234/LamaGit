"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import {
  THRESHOLD_VALUES,
  calculateMultiplier,
  positionToThreshold,
  thresholdToPosition,
  formatBalance,
} from "@/lib/utils"
import { Percent, TrendingUp } from "lucide-react"

interface HistoryItem {
  result: number
  threshold: number
  won: boolean
  bet: number
  payout: number
  timestamp: number
}

interface ProbabilityDisplayProps {
  threshold: number
  onThresholdChange: (threshold: number) => void
  bet: number
  disabled?: boolean
  history: HistoryItem[]
}

export function ProbabilityDisplay({
  threshold,
  onThresholdChange,
  bet,
  disabled = false,
  history,
}: ProbabilityDisplayProps) {
  const multiplier = calculateMultiplier(threshold)
  const potentialPayout = bet * multiplier
  const winChance = threshold

  // Convert threshold to slider position (0-99)
  const sliderPosition = thresholdToPosition(threshold)

  const handleSliderChange = (value: number[]) => {
    const newThreshold = positionToThreshold(value[0])
    onThresholdChange(newThreshold)
  }

  // Calculate the width percentage for the win zone
  const winZoneWidth = (threshold / 98.02) * 100

  // Get last result for the label
  const lastResult = history.length > 0 ? history[0].result : null

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Win Chance */}
        <div className="bg-card-gradient rounded-lg p-4 text-center border border-border">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-xs">Probabilidad</span>
          </div>
          <span className="text-2xl font-bold text-success">
            {winChance.toFixed(2)}%
          </span>
        </div>

        {/* Multiplier */}
        <div className="bg-card-gradient rounded-lg p-4 text-center border border-border">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Multiplicador</span>
          </div>
          <span className="text-2xl font-bold text-accent">
            {multiplier.toFixed(4)}x
          </span>
        </div>

        {/* Potential Payout */}
        <div className="bg-card-gradient rounded-lg p-4 text-center border border-border">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
            <span className="text-xs">Pago Potencial</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            S/ {formatBalance(potentialPayout)}
          </span>
        </div>
      </div>

      {/* Threshold Slider */}
      <div className="space-y-4 bg-card-gradient rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              Umbral de Victoria
            </label>
            {/* Mini history pills — max 5, newest first, fade-in on mount */}
            {history.slice(0, 5).map((item) => (
              <span
                key={item.timestamp}
                className={`history-mini-pill text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                  item.won
                    ? "bg-success/20 text-success border-success/30"
                    : "bg-destructive/20 text-destructive border-destructive/30"
                }`}
                title={`Umbral: ${item.threshold.toFixed(2)}`}
              >
                {item.result.toFixed(2)}
              </span>
            ))}
          </div>
          <span className="text-lg font-bold text-foreground shrink-0">
            {threshold.toFixed(2)}
          </span>
        </div>

        {/* Markers 0 - 25 - 50 - 75 - 100 alineados al slider (max=99) */}
        <div className="relative h-5" style={{ marginBottom: "2px" }}>
          {[
            { label: "0",   pos: 0,       color: "#22c55e", anchor: "left"   },
            { label: "25",  pos: 25 / 99, color: "#ffffff", anchor: "center" },
            { label: "50",  pos: 50 / 99, color: "#ffffff", anchor: "center" },
            { label: "75",  pos: 75 / 99, color: "#ffffff", anchor: "center" },
            { label: "100", pos: 1,       color: "#ef4444", anchor: "right"  },
          ].map(({ label, pos, color, anchor, extra = 0 }) => (
            <span
              key={label}
              style={{
                position: "absolute",
                left: extra ? `calc(${pos * 100}% + ${extra}px)` : `${pos * 100}%`,
                transform:
                  anchor === "center" ? "translateX(-50%)"
                  : anchor === "right"  ? "translateX(-100%)"
                  : "none",
                color,
                fontWeight: 800,
                fontSize: "0.85rem",
                lineHeight: 1,
                textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Slider with result label */}
        <div className="relative mt-2">
          {/* Result label positioned where the dice landed */}
          {lastResult !== null && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 bg-[#fbbf24] text-[#0f172a] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap z-10 shadow-md"
              style={{ left: `${lastResult}%`, transition: 'left 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              {lastResult.toFixed(2)}
            </div>
          )}

          <Slider
            value={[sliderPosition]}
            onValueChange={handleSliderChange}
            min={0}
            max={THRESHOLD_VALUES.length - 1}
            step={1}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Explanation */}
        <p className="text-xs text-muted-foreground text-center">
          Ganas si el resultado es <span className="text-success font-medium">menor o igual</span> a {threshold.toFixed(2)}
        </p>
      </div>

    </div>
  )
}
