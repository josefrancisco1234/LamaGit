import { NextRequest, NextResponse } from 'next/server'

// POST - Usuario crea una solicitud de recarga
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
  }

  try {
    const { user_id, username, amount, code } = await request.json()

    if (!user_id || !amount || amount < 5) {
      return NextResponse.json({ error: 'user_id y amount (min 5) requeridos' }, { status: 400 })
    }

    // Insertar solicitud pendiente
    const res = await fetch(
      `${supabaseUrl}/rest/v1/recharge_requests`,
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
          username: username || 'Sin nombre',
          amount,
          code,
          status: 'pending',
        }),
      }
    )

    if (!res.ok) {
      const error = await res.text()
      console.error('Error creating recharge:', error)
      return NextResponse.json({ error: 'Failed to create recharge request' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data[0] || data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
