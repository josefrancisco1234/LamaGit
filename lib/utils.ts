// =============================================================================
// UTILS.TS - Utilidades y Logica del Juego de Dados
// =============================================================================
// Este archivo contiene:
// 1. Funcion cn() para combinar clases CSS (Tailwind)
// 2. Constantes del juego (rangos, factor de casa)
// 3. Funciones de logica del juego (multiplicadores, resultados, etc)
// =============================================================================

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// =============================================================================
// FUNCION CN - Combina clases CSS de forma inteligente
// =============================================================================
// Uso: cn("bg-red-500", "text-white", condition && "hidden")
// Combina clsx (maneja condicionales) con twMerge (resuelve conflictos de Tailwind)
// Ejemplo: cn("p-2 p-4") -> "p-4" (twMerge resuelve el conflicto)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// CONSTANTES DEL JUEGO DE DADOS
// =============================================================================

// Rango del dado: 0 a 100
// El jugador elige un umbral (threshold) y gana si el resultado es <= umbral
// NOTA: El umbral maximo es 98.02, pero el dado puede caer hasta 100
// Esto da ~2% de ventaja extra a la casa (resultados 98.03-100 son perdida segura)
export const DICE_MIN = 0      // Minimo posible del dado
export const DICE_MAX = 100    // Maximo posible del dado

// Valores de umbral permitidos: [0.01, 1, 2, ..., 98, 98.02]
// Total: 100 valores discretos
// - 0.01 = 0.01% probabilidad de ganar (multiplicador muy alto)
// - 50 = 50% probabilidad (multiplicador ~2x)
// - 98.02 = 98.02% probabilidad (multiplicador muy bajo)
export const THRESHOLD_VALUES: number[] = [
  0.01,                                          // Valor minimo
  ...Array.from({ length: 98 }, (_, i) => i + 1), // 1, 2, 3, ..., 98
  98.02,                                         // Valor maximo
]

// Factor de casa: 99 (la casa toma 1% de margen)
// Se usa en la formula del multiplicador: 99 / threshold
// Ejemplo: threshold=50 -> multiplicador = 99/50 = 1.98x
// Si fuera 100/50 = 2x seria "juego justo", pero con 99 la casa tiene ventaja
export const HOUSE_FACTOR = 99

// =============================================================================
// FUNCIONES DE LOGICA DEL JUEGO
// =============================================================================

/**
 * Calcula el multiplicador de pago para un umbral dado
 *
 * FORMULA: multiplicador = 99 / umbral
 *
 * EJEMPLOS:
 * - Umbral 1   -> 99/1  = 99x   (muy dificil ganar, pero paga mucho)
 * - Umbral 50  -> 99/50 = 1.98x (50% chance, casi duplica)
 * - Umbral 98  -> 99/98 = 1.01x (casi seguro ganar, pero paga poco)
 *
 * @param threshold - El umbral de victoria (0.01 a 98.02)
 * @returns El multiplicador (por ejemplo, 1.98 para umbral 50)
 */
export function calculateMultiplier(threshold: number): number {
  // Dividir el factor de casa por el umbral
  // toFixed(4) para precision, luego convertir a numero
  return Number((HOUSE_FACTOR / threshold).toFixed(4))
}

/**
 * Genera un resultado aleatorio del dado entre 0 y 100
 *
 * LOGICA:
 * - Math.random() genera un numero entre 0 y 1 (exclusivo)
 * - Lo escalamos al rango [0, 100]
 * - Redondeamos a 2 decimales
 *
 * HOUSE EDGE:
 * - El umbral maximo es 98.02
 * - El dado puede caer entre 98.03 y 100 (~2% de probabilidad)
 * - En esos casos, el usuario SIEMPRE pierde
 *
 * @returns Un numero con 2 decimales en el rango [0.00, 100.00]
 */
export function generateDiceResult(): number {
  // random * 100 = rango [0, 100)
  const result = Math.random() * DICE_MAX
  // Redondear a 2 decimales y convertir a numero
  return Number(result.toFixed(2))
}

/**
 * Determina si el tiro es ganador
 *
 * REGLA: El jugador GANA si el resultado es <= al umbral elegido
 *
 * EJEMPLOS:
 * - Umbral 50, Resultado 30.55 -> GANA (30.55 <= 50)
 * - Umbral 50, Resultado 75.20 -> PIERDE (75.20 > 50)
 * - Umbral 25, Resultado 25.00 -> GANA (25.00 <= 25)
 *
 * @param result - El resultado del dado
 * @param threshold - El umbral establecido por el jugador
 * @returns true si gana (resultado <= umbral)
 */
export function isWin(result: number, threshold: number): boolean {
  return result <= threshold
}

/**
 * Calcula el pago para una apuesta
 *
 * FORMULA: pago = apuesta * multiplicador (solo si gano)
 *
 * EJEMPLO:
 * - Apuesta: S/ 10, Umbral: 50
 * - Multiplicador: 99/50 = 1.98x
 * - Si GANA: pago = 10 * 1.98 = S/ 19.80
 * - Si PIERDE: pago = S/ 0
 *
 * @param bet - El monto apostado
 * @param threshold - El umbral elegido
 * @param won - Si gano o perdio
 * @returns El monto del pago (0 si perdio)
 */
export function calculatePayout(bet: number, threshold: number, won: boolean): number {
  // Si perdio, no hay pago
  if (!won) return 0

  // Calcular multiplicador y pago
  const multiplier = calculateMultiplier(threshold)
  // Redondear a 2 decimales (centavos)
  return Number((bet * multiplier).toFixed(2))
}

/**
 * Verifica si la apuesta esta en modo demo (sin dinero real)
 *
 * REGLA: Apuestas menores a 0.01 son modo demo
 * - El juego funciona igual pero no se descuenta/acredita dinero real
 * - Permite a usuarios probar el juego sin riesgo
 *
 * @param bet - El monto de la apuesta
 * @returns true si es modo demo (apuesta < 0.01)
 */
export function isDemoMode(bet: number): boolean {
  return bet < 0.01
}

/**
 * Formatea un numero de balance para mostrar en UI
 *
 * FORMATO: Usa configuracion peruana (es-PE)
 * - Separador de miles: coma (,)
 * - Separador decimal: punto (.)
 * - Siempre 2 decimales
 *
 * EJEMPLOS:
 * - 1234.5 -> "1,234.50"
 * - 10 -> "10.00"
 * - 0.5 -> "0.50"
 *
 * @param balance - El balance a formatear
 * @returns String formateado con 2 decimales
 */
export function formatBalance(balance: number): string {
  return balance.toLocaleString('es-PE', {
    minimumFractionDigits: 2, // Minimo 2 decimales
    maximumFractionDigits: 2, // Maximo 2 decimales
  })
}

/**
 * Convierte posicion del slider a valor de umbral
 *
 * El slider tiene 100 posiciones (0-99)
 * Cada posicion corresponde a un valor en THRESHOLD_VALUES
 *
 * MAPEO:
 * - Posicion 0 -> Umbral 0.01
 * - Posicion 1 -> Umbral 1
 * - Posicion 50 -> Umbral 50
 * - Posicion 99 -> Umbral 98.02
 *
 * @param position - Posicion del slider (0-99)
 * @returns El valor del umbral correspondiente
 */
export function positionToThreshold(position: number): number {
  // Asegurar que position este en rango [0, 99]
  return THRESHOLD_VALUES[Math.max(0, Math.min(99, position))]
}

/**
 * Convierte valor de umbral a posicion del slider
 *
 * Inverso de positionToThreshold()
 * Busca el indice del umbral en THRESHOLD_VALUES
 *
 * @param threshold - El valor del umbral
 * @returns La posicion del slider (0-99), o 50 si no se encuentra
 */
export function thresholdToPosition(threshold: number): number {
  // Buscar el indice del umbral en el array
  const index = THRESHOLD_VALUES.indexOf(threshold)
  // Si no se encuentra, retornar posicion media (50)
  return index >= 0 ? index : 50
}
