import { supabase } from './supabaseClient'

// Type for wallet balance response
type WalletBalance = { balance: number }

/**
 * Check if an error is an AbortError (happens when tab is hidden)
 */
function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { name?: string; message?: string }
  return (
    err.name === 'AbortError' ||
    (err.message?.includes('aborted') ?? false) ||
    (err.message?.includes('signal is aborted') ?? false)
  )
}

/**
 * Get the current user's wallet balance
 */
export async function getBalance(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (error || !data) return 0
    return Number((data as WalletBalance).balance ?? 0)
  } catch (e) {
    if (!isAbortError(e)) {
      console.error('getBalance error:', e)
    }
    return 0
  }
}

/**
 * Add or subtract from the wallet balance
 * Uses direct update instead of RPC for simplicity
 */
// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ])
}

// Helper to retry a function
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delayMs: number,
  label: string
): Promise<T> {
  let lastError: Error | null = null
  for (let i = 0; i <= retries; i++) {
    try {
      if (i > 0) console.log(`[walletAdd] Retry ${i}/${retries} for ${label}...`)
      return await fn()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}

export async function walletAdd(amount: number, userId?: string): Promise<number> {
  try {
    console.log('[walletAdd] Starting with amount:', amount, 'userId:', userId)

    // If userId is provided, use it directly (faster, no network call)
    // Otherwise, try to get from session (fallback)
    let finalUserId = userId

    if (!finalUserId) {
      console.log('[walletAdd] No userId provided, trying localStorage...')

      // Try to get user ID from localStorage directly (no network call)
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname.split('.')[0]}-auth-token`
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            finalUserId = parsed?.user?.id
            console.log('[walletAdd] Got userId from localStorage:', finalUserId)
          }
        } catch (e) {
          console.log('[walletAdd] Could not parse localStorage:', e)
        }
      }
    }

    if (!finalUserId) {
      console.error('[walletAdd] No user ID available')
      throw new Error('Not authenticated')
    }

    console.log('[walletAdd] User ID:', finalUserId)

    // Get current balance using fetch directly (bypasses Supabase client issues)
    console.log('[walletAdd] Fetching wallet via REST API...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Get user's access token from localStorage for RLS authentication
    let accessToken = supabaseKey || ''
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `sb-${new URL(supabaseUrl || '').hostname.split('.')[0]}-auth-token`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          accessToken = parsed?.access_token || supabaseKey || ''
          console.log('[walletAdd] Using user access token for RLS')
        }
      } catch (e) {
        console.log('[walletAdd] Could not get access token, using anon key')
      }
    }

    const fetchResponse = await withRetry(
      () => withTimeout(
        fetch(
          `${supabaseUrl}/rest/v1/wallets?user_id=eq.${finalUserId}&select=balance`,
          {
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        ).then(async (res) => {
          console.log('[walletAdd] Fetch response status:', res.status)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        }),
        10000,
        'Wallet fetch timeout'
      ),
      2,
      1000,
      'fetch wallet'
    ) as WalletBalance[]

    console.log('[walletAdd] Fetch response:', fetchResponse)
    const wallet = fetchResponse?.[0]
    const fetchError = wallet ? null : { message: 'No wallet found' }

    if (fetchError) {
      console.error('[walletAdd] Fetch wallet error:', fetchError)
      throw new Error('Wallet fetch error: ' + fetchError.message)
    }
    if (!wallet) {
      console.error('[walletAdd] No wallet found for user')
      throw new Error('Wallet not found')
    }
    const walletData = wallet as WalletBalance
    console.log('[walletAdd] Current balance:', walletData.balance)

    const currentBalance = Number(walletData.balance)
    const newBalance = Number((currentBalance + amount).toFixed(2))
    console.log('[walletAdd] New balance will be:', newBalance)

    // Don't allow negative balance
    if (newBalance < 0) {
      console.error('[walletAdd] Insufficient balance')
      throw new Error('Insufficient balance')
    }

    // Update balance using fetch directly
    console.log('[walletAdd] Updating balance via REST API...')
    const updateResponse = await withRetry(
      () => withTimeout(
        fetch(
          `${supabaseUrl}/rest/v1/wallets?user_id=eq.${finalUserId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ balance: newBalance }),
          }
        ).then(async (res) => {
          console.log('[walletAdd] Update response status:', res.status)
          if (!res.ok) {
            const errorText = await res.text()
            console.error('[walletAdd] Update error response:', errorText)
            throw new Error(`HTTP ${res.status}: ${errorText}`)
          }
          return res.json()
        }),
        10000,
        'Wallet update timeout'
      ),
      2,
      1000,
      'update wallet'
    ) as WalletBalance[]

    console.log('[walletAdd] Update response:', updateResponse)
    const updatedData = updateResponse?.[0]

    if (!updatedData) {
      console.error('[walletAdd] Update returned no data')
      throw new Error('Update error: No data returned (Check RLS UPDATE policy)')
    }
    console.log('[walletAdd] Success! New balance:', updatedData?.balance)
    return Number(updatedData?.balance ?? newBalance)
  } catch (e) {
    if (isAbortError(e)) {
      return 0
    }
    console.error('[walletAdd] Error:', e)
    throw e
  }
}

/**
 * Get wallet data
 */
export async function getWallet(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching wallet:', error)
    return null
  }

  return data
}
