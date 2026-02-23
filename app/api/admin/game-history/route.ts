import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = "troxomoroxo"

// GET - Historial de jugadas de un usuario (?userId=xxx)
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/game_history?user_id=eq.${userId}&order=created_at.desc&limit=20&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    const games = await res.json()

    // Calcular stats sobre TODOS los juegos (no solo los ultimos 20)
    const statsRes = await fetch(
      `${supabaseUrl}/rest/v1/game_history?user_id=eq.${userId}&select=bet_amount,won,payout`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )
    const allGames = statsRes.ok ? await statsRes.json() : []

    const totalGames = allGames.length
    const wins = allGames.filter((g: any) => g.won).length
    const losses = totalGames - wins
    const totalBet = allGames.reduce((s: number, g: any) => s + Number(g.bet_amount), 0)
    const totalPayout = allGames.reduce((s: number, g: any) => s + Number(g.payout), 0)

    return NextResponse.json({
      games,
      stats: {
        totalGames,
        wins,
        losses,
        winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0',
        totalBet: Number(totalBet.toFixed(2)),
        totalPayout: Number(totalPayout.toFixed(2)),
        net: Number((totalPayout - totalBet).toFixed(2)),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
