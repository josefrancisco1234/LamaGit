// =============================================================================
// AFFILIATES.TS - Sistema de Referidos LamaDice
// =============================================================================
// Logica: cuando un jugador referido pierde una apuesta, el referidor
// recibe automaticamente 1% del monto perdido via trigger de Supabase.
// =============================================================================

function getAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  let accessToken = supabaseKey
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        accessToken = parsed?.access_token || supabaseKey
      }
    } catch (e) {}
  }
  return { supabaseUrl, supabaseKey, accessToken }
}

export interface AffiliateEarning {
  commission_amount: number
  bet_amount: number
  referred_id: string
  created_at: string
}

export interface AffiliateStats {
  totalEarned: number
  referencesCount: number
  recentEarnings: AffiliateEarning[]
}

// Obtiene las estadisticas de afiliado del usuario
export async function getAffiliateStats(userId: string): Promise<AffiliateStats> {
  const { supabaseUrl, supabaseKey, accessToken } = getAuth()
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/affiliate_earnings?referrer_id=eq.${userId}&select=commission_amount,bet_amount,referred_id,created_at&order=created_at.desc`,
      { headers }
    )
    if (!res.ok) return { totalEarned: 0, referencesCount: 0, recentEarnings: [] }
    const earnings: AffiliateEarning[] = await res.json()
    const totalEarned = earnings.reduce((s, e) => s + Number(e.commission_amount), 0)
    const uniqueRefs = new Set(earnings.map((e) => e.referred_id)).size
    return {
      totalEarned: Number(totalEarned.toFixed(2)),
      referencesCount: uniqueRefs,
      recentEarnings: earnings.slice(0, 20),
    }
  } catch (e) {
    return { totalEarned: 0, referencesCount: 0, recentEarnings: [] }
  }
}

// Procesa la comision cuando un jugador referido pierde
// El trigger de Supabase acredita automaticamente al referidor
export async function processAffiliateCommission(
  referredUserId: string,
  betAmount: number
): Promise<void> {
  if (betAmount <= 0) return
  const { supabaseUrl, supabaseKey, accessToken } = getAuth()
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
  try {
    // Verificar si este usuario tiene un referidor
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${referredUserId}&select=referred_by`,
      { headers }
    )
    if (!profileRes.ok) return
    const profiles = await profileRes.json()
    const referrerId = profiles?.[0]?.referred_by
    if (!referrerId) return // No fue referido

    const commission = Number((betAmount * 0.01).toFixed(2))
    if (commission < 0.01) return

    // Insertar registro de ganancia (el trigger de DB acredita la wallet del referidor)
    await fetch(`${supabaseUrl}/rest/v1/affiliate_earnings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        referrer_id: referrerId,
        referred_id: referredUserId,
        bet_amount: betAmount,
        commission_amount: commission,
      }),
    })
    console.log(`[affiliates] S/ ${commission} credited to referrer ${referrerId}`)
  } catch (e) {
    console.error('[processAffiliateCommission]', e)
  }
}

// Vincula un nuevo usuario con su referidor usando el codigo (username del referidor)
export async function setReferredBy(userId: string, referralCode: string): Promise<boolean> {
  if (!referralCode.trim()) return false
  const { supabaseUrl, supabaseKey, accessToken } = getAuth()
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?username=ilike.${encodeURIComponent(referralCode.trim())}&select=id`,
      { headers }
    )
    if (!res.ok) return false
    const referrers = await res.json()
    const referrerId = referrers?.[0]?.id
    if (!referrerId || referrerId === userId) return false

    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ referred_by: referrerId }),
    })
    return true
  } catch (e) {
    console.error('[setReferredBy]', e)
    return false
  }
}
