import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Debug: Log if running with placeholder values
if (typeof window !== 'undefined') {
  console.log('[Supabase] URL configured:', supabaseUrl.includes('placeholder') ? 'NO - using placeholder!' : 'Yes')
  console.log('[Supabase] Key configured:', supabaseAnonKey === 'placeholder-key' ? 'NO - using placeholder!' : 'Yes')
}

// Check if Supabase is properly configured
export const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'

// Create a single Supabase client for the entire app
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

// Track when the tab was last hidden for session refresh logic
let lastHidden = 0

if (typeof window !== 'undefined' && isSupabaseConfigured) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lastHidden = Date.now()
    } else {
      const hiddenFor = Date.now() - lastHidden
      // If tab was hidden for more than 30 seconds, refresh the session
      if (hiddenFor > 30000) {
        supabase.auth.refreshSession().catch(console.error)
      }
    }
  })
}

export default supabase
