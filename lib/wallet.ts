import { supabase } from './supabaseClient'

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
    return Number(data.balance ?? 0)
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
export async function walletAdd(amount: number): Promise<number> {
  try {
    console.log('[walletAdd] Starting with amount:', amount)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('[walletAdd] Auth error:', authError)
      throw new Error('Auth error: ' + authError.message)
    }
    if (!user) {
      console.error('[walletAdd] No user found')
      throw new Error('Not authenticated')
    }
    console.log('[walletAdd] User ID:', user.id)

    // Get current balance
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('[walletAdd] Fetch wallet error:', fetchError)
      throw new Error('Wallet fetch error: ' + fetchError.message)
    }
    if (!wallet) {
      console.error('[walletAdd] No wallet found for user')
      throw new Error('Wallet not found')
    }
    console.log('[walletAdd] Current balance:', wallet.balance)

    const currentBalance = Number(wallet.balance)
    const newBalance = Number((currentBalance + amount).toFixed(2))
    console.log('[walletAdd] New balance will be:', newBalance)

    // Don't allow negative balance
    if (newBalance < 0) {
      console.error('[walletAdd] Insufficient balance')
      throw new Error('Insufficient balance')
    }

    // Update balance
    console.log('[walletAdd] Updating balance...')
    const { data, error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', user.id)
      .select('balance')
      .single()

    if (error) {
      console.error('[walletAdd] Update error:', error)
      throw new Error('Update error: ' + error.message + ' (Check RLS UPDATE policy)')
    }

    console.log('[walletAdd] Success! New balance:', data?.balance)
    return Number(data?.balance ?? newBalance)
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
