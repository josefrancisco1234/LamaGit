import { NextRequest, NextResponse } from 'next/server'

const UNLOCK_THRESHOLD = 200

// GET /api/chat?user_id=xxx — mensajes últimas 24h + check de unlock
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ messages: [], totalBet: 0, unlocked: false })

  try {
    // Mensajes de las últimas 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const msgsRes = await fetch(
      `${supabaseUrl}/rest/v1/community_chat?created_at=gte.${since}&order=created_at.asc&limit=200&select=*`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    )
    const messages = msgsRes.ok ? await msgsRes.json() : []

    // Check unlock para el usuario actual
    let totalBet = 0
    let unlocked = false
    if (userId) {
      const betRes = await fetch(
        `${supabaseUrl}/rest/v1/game_history?user_id=eq.${userId}&select=bet_amount`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
      )
      const bets = betRes.ok ? await betRes.json() : []
      totalBet = bets.reduce((s: number, g: { bet_amount: string | number }) => s + Number(g.bet_amount), 0)
      unlocked = totalBet >= UNLOCK_THRESHOLD
    }

    return NextResponse.json({ messages, totalBet: Math.round(totalBet * 100) / 100, unlocked })
  } catch {
    return NextResponse.json({ messages: [], totalBet: 0, unlocked: false })
  }
}

// POST /api/chat — usuario envía mensaje al chat comunitario
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })

  try {
    const { user_id, username, message } = await request.json()
    if (!user_id || !message?.trim()) {
      return NextResponse.json({ error: 'user_id y message requeridos' }, { status: 400 })
    }

    // Verificar unlock
    const betRes = await fetch(
      `${supabaseUrl}/rest/v1/game_history?user_id=eq.${user_id}&select=bet_amount`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    )
    const bets = betRes.ok ? await betRes.json() : []
    const totalBet = bets.reduce((s: number, g: { bet_amount: string | number }) => s + Number(g.bet_amount), 0)
    if (totalBet < UNLOCK_THRESHOLD) {
      return NextResponse.json({ error: 'Chat bloqueado' }, { status: 403 })
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/community_chat`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id,
          username: username || 'Usuario',
          message: message.trim().slice(0, 300),
        }),
      }
    )
    if (!res.ok) return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    const data = await res.json()
    return NextResponse.json(data[0] || data)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
