import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = "troxomoroxo"

// GET - Lista solicitudes de retiro
export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/withdrawal_requests?order=created_at.desc&limit=50&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )

    if (!res.ok) return NextResponse.json([], { status: 200 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// PATCH - Aprobar o rechazar retiro
export async function PATCH(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })

  try {
    const { id, action } = await request.json()
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'id y action requeridos' }, { status: 400 })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'

    // If rejecting, refund the amount to the user (was already deducted on creation)
    if (action === 'reject') {
      const wRes = await fetch(
        `${supabaseUrl}/rest/v1/withdrawal_requests?id=eq.${id}&select=*`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
      )
      if (wRes.ok) {
        const [withdrawal] = await wRes.json()
        if (withdrawal) {
          const balRes = await fetch(
            `${supabaseUrl}/rest/v1/wallets?user_id=eq.${withdrawal.user_id}&select=balance`,
            { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
          )
          if (balRes.ok) {
            const [wallet] = await balRes.json()
            if (wallet) {
              const refundedBalance = Number(wallet.balance) + Number(withdrawal.amount)
              await fetch(
                `${supabaseUrl}/rest/v1/wallets?user_id=eq.${withdrawal.user_id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                  },
                  body: JSON.stringify({ balance: refundedBalance }),
                }
              )
            }
          }
        }
      }
    }

    // Update status
    const res = await fetch(
      `${supabaseUrl}/rest/v1/withdrawal_requests?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status, resolved_at: new Date().toISOString() }),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
