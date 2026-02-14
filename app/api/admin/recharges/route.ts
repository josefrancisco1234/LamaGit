import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = "troxomoroxo"

// GET - Listar todas las solicitudes de recarga
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/recharge_requests?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recharges' }, { status: 500 })
  }
}

// PATCH - Aprobar o rechazar una solicitud
export async function PATCH(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
  }

  try {
    const { id, action } = await request.json()

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'id y action (approve/reject) requeridos' }, { status: 400 })
    }

    // Obtener la solicitud
    const getRes = await fetch(
      `${supabaseUrl}/rest/v1/recharge_requests?id=eq.${id}&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )

    const requests = await getRes.json()
    if (!requests || requests.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const rechargeReq = requests[0]

    if (rechargeReq.status !== 'pending') {
      return NextResponse.json({ error: 'Solicitud ya fue procesada' }, { status: 400 })
    }

    // Si aprobamos, agregar dinero al wallet del usuario
    if (action === 'approve') {
      // Obtener wallet actual
      const walletRes = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${rechargeReq.user_id}&select=*`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
        }
      )

      const wallets = await walletRes.json()

      if (wallets && wallets.length > 0) {
        const currentBalance = Number(wallets[0].balance)
        const newBalance = currentBalance + Number(rechargeReq.amount)

        // Actualizar balance
        await fetch(
          `${supabaseUrl}/rest/v1/wallets?user_id=eq.${rechargeReq.user_id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ balance: newBalance }),
          }
        )
      }
    }

    // Actualizar estado de la solicitud
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    await fetch(
      `${supabaseUrl}/rest/v1/recharge_requests?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          resolved_at: new Date().toISOString(),
        }),
      }
    )

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
