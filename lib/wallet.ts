import { supabase } from './supabaseClient'

/**
 * Check if an error is an AbortError (happens when tab is hidden)
 * These errors are expected and should be silently ignored
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
 * Check if an error is an authentication error
 */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: number | string; message?: string }
  const msg = err.message?.toLowerCase() || ''
  return (
    err.code === 401 ||
    err.code === 403 ||
    err.code === '401' ||
    err.code === '403' ||
    msg.includes('jwt') ||
    msg.includes('auth') ||
    msg.includes('token')
  )
}

/**
 * Get the current user's wallet balance
 * @returns The balance or 0 if not found/not authenticated
 */
export async function getBalance(): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Try to refresh the session
      const { data: refreshed } = await supabase.auth.refreshSession()
      if (!refreshed.session) return 0
    }

    const userId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id
    if (!userId) return 0

    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching balance:', error)
      return 0
    }

    return Number(data?.balance ?? 0)
  } catch (e) {
    // Silently ignore abort errors (tab hidden)
    if (!isAbortError(e)) {
      console.error('getBalance error:', e)
    }
    return 0
  }
}

/**
 * Add or subtract from the wallet balance atomically
 * Uses the wallet_add RPC function for race-condition-safe updates
 * @param amount - Amount to add (negative to subtract)
 * @returns The new balance
 */
export async function walletAdd(amount: number): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('wallet_add', {
      p_amount: Number(amount.toFixed(2)),
    })

    if (error) {
      // If it's an auth error, try to refresh and retry once
      if (isAuthError(error)) {
        console.log('Auth error, attempting refresh...')
        await supabase.auth.refreshSession()

        const { data: retryData, error: retryError } = await supabase.rpc('wallet_add', {
          p_amount: Number(amount.toFixed(2)),
        })

        if (retryError) {
          console.error('Retry failed:', retryError)
          throw new Error(retryError.message)
        }

        return Number(retryData)
      }

      throw new Error(error.message)
    }

    return Number(data)
  } catch (e) {
    // Silently ignore abort errors (tab hidden)
    if (isAbortError(e)) {
      return 0 // Return 0 silently for aborted requests
    }
    console.error('walletAdd error:', e)
    throw e
  }
}

/**
 * Convenience function to refresh and get the latest wallet data
 * @param userId - The user ID
 * @returns The wallet record or null
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
