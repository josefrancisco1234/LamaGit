import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = "troxomoroxo"

// POST - Acciones globales
export async function POST(request: NextRequest) {
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
    const body = await request.json()

    // Reset all balances
    if (body.action === 'reset_all_balances' && body.amount !== undefined) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/wallets`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ balance: body.amount }),
        }
      )

      if (!res.ok) {
        const error = await res.text()
        return NextResponse.json({ error }, { status: res.status })
      }

      return NextResponse.json({ success: true, action: 'reset_all_balances' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error in global action:', error)
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 })
  }
}
