import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = "troxomoroxo"

// PATCH - Actualizar usuario (balance, ban status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

    // Si viene balance, actualizar wallet
    if (body.balance !== undefined) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ balance: body.balance }),
        }
      )

      if (!res.ok) {
        const error = await res.text()
        return NextResponse.json({ error }, { status: res.status })
      }
    }

    // Si viene banned, actualizar profile
    if (body.banned !== undefined) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ banned: body.banned }),
        }
      )

      if (!res.ok) {
        const error = await res.text()
        return NextResponse.json({ error }, { status: res.status })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
    // Eliminar wallet primero (foreign key)
    await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )

    // Eliminar profile
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
