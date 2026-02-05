import { supabase } from './supabaseClient'

// =============================================================================
// WALLET.TS - Manejo de billetera con Supabase
// =============================================================================
//
// PROBLEMA ORIGINAL:
// El cliente Supabase JS (supabase.from().select()) se colgaba en Vercel
// pero funcionaba perfecto en localhost. Esto pasaba porque:
// 1. supabase.auth.getSession() tardaba >10 segundos en Vercel
// 2. Las queries del cliente Supabase tambien se colgaban
//
// SOLUCION:
// Usar fetch() directo al REST API de Supabase en lugar del cliente JS.
// Esto requiere:
// 1. Obtener el JWT access_token del usuario desde localStorage
// 2. Enviarlo en el header Authorization para que RLS funcione
// 3. Usar timeouts y reintentos para mayor robustez
//
// =============================================================================

// Tipo para la respuesta de balance
type WalletBalance = { balance: number }

/**
 * Detecta si un error es AbortError (ocurre al cambiar de pestaña)
 * Estos errores son esperados y no deben mostrarse al usuario
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
 * Get the current user's wallet balance (usa cliente Supabase - solo para localhost)
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

// =============================================================================
// HELPERS PARA FETCH DIRECTO
// =============================================================================

/**
 * HELPER: Agrega timeout a una promesa
 * Si la promesa no se resuelve en X milisegundos, lanza un error
 *
 * Por que es necesario:
 * - En Vercel, algunas llamadas se cuelgan indefinidamente
 * - Con timeout, al menos sabemos que algo fallo y podemos reintentar
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ])
}

/**
 * HELPER: Reintenta una funcion N veces si falla
 *
 * Por que es necesario:
 * - A veces la primera llamada falla pero la segunda funciona
 * - Especialmente util para "cold starts" de Supabase free tier
 */
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

// =============================================================================
// FUNCION PRINCIPAL: walletAdd
// =============================================================================

/**
 * Agrega o resta dinero de la billetera del usuario
 *
 * @param amount - Cantidad a agregar (positivo) o restar (negativo)
 * @param userId - ID del usuario (opcional, se obtiene de localStorage si no se pasa)
 *
 * CAMBIO CLAVE: Recibe userId como parametro
 * Antes: Llamaba a supabase.auth.getSession() que se colgaba en Vercel
 * Ahora: El componente pasa el userId directamente desde el contexto de auth
 */
export async function walletAdd(amount: number, userId?: string): Promise<number> {
  try {
    console.log('[walletAdd] Starting with amount:', amount, 'userId:', userId)

    // =========================================================================
    // PASO 1: Obtener el User ID
    // =========================================================================
    // Si el componente paso el userId, lo usamos directamente (mas rapido)
    // Si no, intentamos obtenerlo de localStorage (fallback)
    let finalUserId = userId

    if (!finalUserId) {
      console.log('[walletAdd] No userId provided, trying localStorage...')

      // Obtener user ID desde localStorage (sin llamada de red)
      // La key de Supabase es: sb-{project-ref}-auth-token
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

    // =========================================================================
    // PASO 2: Obtener el JWT Access Token para RLS
    // =========================================================================
    // IMPORTANTE: Sin el access_token, Supabase RLS no sabe quien es el usuario
    // y retorna array vacio [] porque las politicas RLS bloquean el acceso
    //
    // El token se guarda en localStorage cuando el usuario inicia sesion
    // Formato: { access_token: "eyJ...", user: { id: "..." }, ... }
    console.log('[walletAdd] Fetching wallet via REST API...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let accessToken = supabaseKey || ''
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `sb-${new URL(supabaseUrl || '').hostname.split('.')[0]}-auth-token`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          // CLAVE: Usar access_token del usuario, NO el anon key
          accessToken = parsed?.access_token || supabaseKey || ''
          console.log('[walletAdd] Using user access token for RLS')
        }
      } catch (e) {
        console.log('[walletAdd] Could not get access token, using anon key')
      }
    }

    // =========================================================================
    // PASO 3: Obtener balance actual via REST API
    // =========================================================================
    // URL del REST API de Supabase: {url}/rest/v1/{tabla}?{filtros}
    // Headers necesarios:
    // - apikey: La anon key del proyecto (siempre requerida)
    // - Authorization: Bearer {access_token} (para que RLS identifique al usuario)
    const fetchResponse = await withRetry(
      () => withTimeout(
        fetch(
          `${supabaseUrl}/rest/v1/wallets?user_id=eq.${finalUserId}&select=balance`,
          {
            headers: {
              'apikey': supabaseKey || '',              // Siempre requerido
              'Authorization': `Bearer ${accessToken}`, // JWT del usuario para RLS
              'Content-Type': 'application/json',
            },
          }
        ).then(async (res) => {
          console.log('[walletAdd] Fetch response status:', res.status)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        }),
        10000, // 10 segundos de timeout
        'Wallet fetch timeout'
      ),
      2,     // 2 reintentos
      1000,  // 1 segundo entre reintentos
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

    // =========================================================================
    // PASO 4: Calcular nuevo balance
    // =========================================================================
    const currentBalance = Number(walletData.balance)
    const newBalance = Number((currentBalance + amount).toFixed(2))
    console.log('[walletAdd] New balance will be:', newBalance)

    // No permitir balance negativo
    if (newBalance < 0) {
      console.error('[walletAdd] Insufficient balance')
      throw new Error('Insufficient balance')
    }

    // =========================================================================
    // PASO 5: Actualizar balance via REST API (PATCH)
    // =========================================================================
    // PATCH = actualizar campos especificos
    // Header especial: 'Prefer': 'return=representation' = retornar el objeto actualizado
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
              'Prefer': 'return=representation', // Retorna el objeto actualizado
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
 * Get wallet data (usa cliente Supabase - puede fallar en Vercel)
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
