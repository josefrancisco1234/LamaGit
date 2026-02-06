import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = "troxomoroxo"

// GET - Obtener todos los usuarios
export async function GET(request: NextRequest) {
  // Verificar password en header
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
    // Fetch profiles con service key (bypasa RLS)
    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )
    const profiles = await profilesRes.json()

    // Fetch wallets
    const walletsRes = await fetch(
      `${supabaseUrl}/rest/v1/wallets?select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    )
    const wallets = await walletsRes.json()

    // Combinar datos
    const users = profiles.map((profile: any) => {
      const wallet = wallets.find((w: any) => w.user_id === profile.id)
      return {
        id: profile.id,
        email: profile.email || 'N/A',
        username: profile.username || 'Sin nombre',
        balance: wallet?.balance || 0,
        created_at: profile.created_at,
        banned: profile.banned || false,
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
