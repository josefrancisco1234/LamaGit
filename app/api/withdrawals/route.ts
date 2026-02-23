import { NextRequest, NextResponse } from 'next/server'

// POST - Usuario crea una solicitud de retiro (descuenta saldo inmediatamente)
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
  }

  try {
    const { user_id, username, amount, holder_name, phone, document_id, cci } = await request.json()

    if (!user_id || !amount || amount < 10) {
      return NextResponse.json({ error: 'user_id y amount (min 10) requeridos' }, { status: 400 })
    }

    if (!phone || !document_id || !cci) {
      return NextResponse.json({ error: 'phone, document_id y cci son requeridos' }, { status: 400 })
    }

    // 1. Verificar saldo actual
    const balRes = await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${user_id}&select=balance`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    )
    if (!balRes.ok) {
      return NextResponse.json({ error: 'No se pudo verificar el saldo' }, { status: 500 })
    }
    const [wallet] = await balRes.json()
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet no encontrada' }, { status: 404 })
    }
    const currentBalance = Number(wallet.balance)
    if (currentBalance < amount) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
    }

    // 2. Descontar saldo inmediatamente
    const newBalance = Math.max(0, currentBalance - Number(amount))
    const deductRes = await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${user_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ balance: newBalance }),
      }
    )
    if (!deductRes.ok) {
      return NextResponse.json({ error: 'Error al descontar saldo' }, { status: 500 })
    }

    // 3. Crear solicitud de retiro en estado pending
    const res = await fetch(
      `${supabaseUrl}/rest/v1/withdrawal_requests`,
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
          holder_name: holder_name || '',
          phone,
          document_id,
          cci,
          status: 'pending',
        }),
      }
    )

    if (!res.ok) {
      // Si falla la creación del registro, revertir el saldo
      await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${user_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ balance: currentBalance }),
        }
      )
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data[0] || data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
