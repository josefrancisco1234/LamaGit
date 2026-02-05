// =============================================================================
// SUPABASE-CLIENT.TS - Cliente de Supabase para toda la aplicacion
// =============================================================================
// Este archivo crea y configura el cliente de Supabase que se usa en toda la app.
// Supabase es nuestro backend: base de datos, autenticacion, storage, etc.
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database' // Tipos generados de nuestra BD

// =============================================================================
// VARIABLES DE ENTORNO
// =============================================================================
// Estas variables se configuran en:
// - Local: archivo .env.local
// - Vercel: Settings > Environment Variables
//
// NEXT_PUBLIC_ = expuesta al cliente (browser)
// Sin NEXT_PUBLIC_ = solo disponible en el servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// =============================================================================
// DEBUG: Verificar que las variables estan configuradas
// =============================================================================
// Esto ayuda a detectar problemas de configuracion en la consola del browser
if (typeof window !== 'undefined') {
  // typeof window !== 'undefined' = estamos en el browser (no en el servidor)
  console.log('[Supabase] URL configured:', supabaseUrl.includes('placeholder') ? 'NO - using placeholder!' : 'Yes')
  console.log('[Supabase] Key configured:', supabaseAnonKey === 'placeholder-key' ? 'NO - using placeholder!' : 'Yes')
}

// =============================================================================
// VERIFICACION DE CONFIGURACION
// =============================================================================
// Esta variable se puede usar en componentes para mostrar mensajes de error
// si Supabase no esta configurado correctamente
export const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'

// =============================================================================
// CREAR CLIENTE DE SUPABASE
// =============================================================================
// createClient crea una instancia del cliente de Supabase
// Solo necesitamos UNA instancia para toda la app (singleton pattern)
//
// El tipo Database viene de @/types/database.ts y define la estructura de nuestra BD
// Esto nos da autocompletado y type-safety en las queries
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,      // URL del proyecto: https://xxx.supabase.co
  supabaseAnonKey,  // Anon Key: clave publica para operaciones del lado del cliente
  {
    auth: {
      // persistSession: true = guardar la sesion en localStorage
      // Esto permite que el usuario siga logueado al cerrar y abrir el browser
      persistSession: true,

      // autoRefreshToken: true = refrescar automaticamente el JWT antes de que expire
      // El JWT de Supabase expira cada hora por defecto
      autoRefreshToken: true,

      // detectSessionInUrl: true = detectar tokens en la URL (para OAuth, magic links)
      // Cuando un usuario hace login con Google, el token viene en la URL
      detectSessionInUrl: true,

      // storage: donde guardar la sesion
      // En el browser usamos localStorage
      // En el servidor (SSR) no hay localStorage, asi que pasamos undefined
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

// =============================================================================
// AUTO-REFRESH DE SESION AL VOLVER A LA PESTANA
// =============================================================================
// Cuando el usuario cambia de pestana y vuelve, la sesion puede estar "stale"
// (el token puede haber expirado). Este codigo refresca la sesion automaticamente.

// Variable para trackear cuando se oculto la pestana por ultima vez
let lastHidden = 0

// Solo ejecutar en el browser y si Supabase esta configurado
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  // visibilitychange se dispara cuando el usuario cambia de pestana
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // La pestana se oculto - guardar el timestamp
      lastHidden = Date.now()
    } else {
      // La pestana se volvio visible - calcular cuanto tiempo estuvo oculta
      const hiddenFor = Date.now() - lastHidden

      // Si estuvo oculta mas de 30 segundos, refrescar la sesion
      // Esto evita problemas con tokens expirados
      if (hiddenFor > 30000) {
        supabase.auth.refreshSession().catch(console.error)
      }
    }
  })
}

// Exportar el cliente como default para facilitar imports
// import supabase from '@/lib/supabaseClient'
// o
// import { supabase } from '@/lib/supabaseClient'
export default supabase
