import { NextResponse } from 'next/server'

// GET - Stats globales públicas (sin auth)
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ totalGames: 0, totalBet: 0 })
  }

  try {
    // Total de partidas via Content-Range header
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/game_history?select=id`,
      {
        method: 'HEAD',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'count=exact',
        },
      }
    )
    const contentRange = countRes.headers.get('content-range') // "0-49/1234"
    const totalGames = contentRange ? parseInt(contentRange.split('/')[1]) || 0 : 0

    // Total dinero apostado
    const betRes = await fetch(
      `${supabaseUrl}/rest/v1/game_history?select=bet_amount`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )
    const bets = betRes.ok ? await betRes.json() : []
    const totalBet = bets.reduce((s: number, g: { bet_amount: string | number }) => s + Number(g.bet_amount), 0)

    return NextResponse.json({
      totalGames,
      totalBet: Number(totalBet.toFixed(2)),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ totalGames: 0, totalBet: 0 })
  }
}
