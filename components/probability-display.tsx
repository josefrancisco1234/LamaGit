"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  THRESHOLD_VALUES,
  calculateMultiplier,
  positionToThreshold,
  thresholdToPosition,
  formatBalance,
} from "@/lib/utils"
import { Percent, TrendingUp, History } from "lucide-react"

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
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">
            Umbral de Victoria
          </label>
          <span className="text-lg font-bold text-foreground">
            {threshold.toFixed(2)}
          </span>
        </div>

        {/* Visual bar showing win/lose zones */}
        <div className="relative h-3 rounded-full overflow-hidden bg-destructive/30">
          <div
            className="absolute left-0 top-0 h-full bg-success/50 transition-all duration-200"
            style={{ width: `${winZoneWidth}%` }}
          />
        </div>

        {/* Slider */}
        <Slider
          value={[sliderPosition]}
          onValueChange={handleSliderChange}
          min={0}
          max={THRESHOLD_VALUES.length - 1}
          step={1}
          disabled={disabled}
          className="w-full"
        />

        {/* Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-success">0.01 (99x)</span>
          <span className="text-destructive">98.02 (1.01x)</span>
        </div>

        {/* Explanation */}
        <p className="text-xs text-muted-foreground text-center">
          Ganas si el resultado es <span className="text-success font-medium">menor o igual</span> a {threshold.toFixed(2)}
        </p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card-gradient rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Ultimas tiradas
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {history.slice(0, 30).map((item, index) => (
              <Badge
                key={item.timestamp}
                variant={item.won ? "success" : "destructive"}
                className="text-xs font-mono cursor-default"
                title={`Umbral: ${item.threshold.toFixed(2)}`}
              >
                {item.result.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
