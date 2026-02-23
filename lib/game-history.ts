// =============================================================================
// GAME-HISTORY.TS - Guarda historial de jugadas en Supabase
// =============================================================================

function getAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  let accessToken = supabaseKey
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        accessToken = parsed?.access_token || supabaseKey
      }
    } catch {}
  }
  return { supabaseUrl, supabaseKey, accessToken }
}

export interface GameResult {
  userId: string
  result: number
  threshold: number
  betAmount: number
  won: boolean
  payout: number
}

export async function saveGameResult(game: GameResult): Promise<void> {
  if (game.betAmount <= 0) return
  const { supabaseUrl, supabaseKey, accessToken } = getAuth()
  try {
    await fetch(`${supabaseUrl}/rest/v1/game_history`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: game.userId,
        result: game.result,
        threshold: game.threshold,
        bet_amount: game.betAmount,
        won: game.won,
        payout: game.payout,
      }),
    })
  } catch {}
}
