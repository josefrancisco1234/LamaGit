import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dice game constants
export const DICE_MIN = 0.01
export const DICE_MAX = 98.02

// Generate allowed threshold values: [0.01, 1, 2, ..., 98, 98.02] (100 values)
export const THRESHOLD_VALUES: number[] = [
  0.01,
  ...Array.from({ length: 98 }, (_, i) => i + 1),
  98.02,
]

// House factor
export const HOUSE_FACTOR = 99

/**
 * Calculate the payout multiplier for a given threshold
 * @param threshold - The win threshold (0.01 to 98.02)
 * @returns The multiplier (e.g., threshold=50 -> 1.98x)
 */
export function calculateMultiplier(threshold: number): number {
  return Number((HOUSE_FACTOR / threshold).toFixed(4))
}

/**
 * Generate a random dice result between 0.01 and 98.02
 * @returns A number with 2 decimal places
 */
export function generateDiceResult(): number {
  const result = DICE_MIN + Math.random() * (DICE_MAX - DICE_MIN)
  return Number(result.toFixed(2))
}

/**
 * Determine if the roll is a win
 * @param result - The dice roll result
 * @param threshold - The threshold set by the player
 * @returns true if result <= threshold (win)
 */
export function isWin(result: number, threshold: number): boolean {
  return result <= threshold
}

/**
 * Calculate the payout for a winning bet
 * @param bet - The bet amount
 * @param threshold - The threshold
 * @param won - Whether the bet won
 * @returns The payout amount (0 if lost)
 */
export function calculatePayout(bet: number, threshold: number, won: boolean): number {
  if (!won) return 0
  const multiplier = calculateMultiplier(threshold)
  return Number((bet * multiplier).toFixed(2))
}

/**
 * Check if bet is in demo mode (no real money)
 * @param bet - The bet amount
 * @returns true if bet < 0.01
 */
export function isDemoMode(bet: number): boolean {
  return bet < 0.01
}

/**
 * Format a balance number for display
 * @param balance - The balance to format
 * @returns Formatted string with 2 decimal places
 */
export function formatBalance(balance: number): string {
  return balance.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Get the threshold value from slider position
 * @param position - Slider position (0-99)
 * @returns The threshold value
 */
export function positionToThreshold(position: number): number {
  return THRESHOLD_VALUES[Math.max(0, Math.min(99, position))]
}

/**
 * Get the slider position from threshold value
 * @param threshold - The threshold value
 * @returns The slider position (0-99)
 */
export function thresholdToPosition(threshold: number): number {
  const index = THRESHOLD_VALUES.indexOf(threshold)
  return index >= 0 ? index : 50 // Default to middle if not found
}
