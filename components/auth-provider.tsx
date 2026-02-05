// =============================================================================
// AUTH-PROVIDER.TSX - Contexto de Autenticacion Global
// =============================================================================
// Este archivo maneja todo el estado de autenticacion de la aplicacion.
// Usa React Context para compartir el estado del usuario en toda la app.
// =============================================================================

"use client" // Indica que este componente se ejecuta en el cliente (browser)

import * as React from "react"
import { User, Session } from "@supabase/supabase-js" // Tipos de Supabase
import { supabase } from "@/lib/supabaseClient" // Cliente de Supabase
import type { Profile, Wallet } from "@/types/database" // Tipos de nuestra BD

// =============================================================================
// TIPOS - Define la estructura del contexto de autenticacion
// =============================================================================
interface AuthContextType {
  user: User | null              // Usuario actual de Supabase (email, id, etc)
  profile: Profile | null        // Perfil del usuario (username, etc)
  wallet: Wallet | null          // Billetera del usuario (balance, etc)
  loading: boolean               // true mientras carga la sesion inicial
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshWallet: () => Promise<void> // Actualiza el balance desde la BD
}

// Crea el contexto con valor inicial undefined
const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

// =============================================================================
// COMPONENTE PRINCIPAL: AuthProvider
// =============================================================================
// Envuelve toda la aplicacion y proporciona el estado de autenticacion
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ---------------------------------------------------------------------------
  // ESTADO - Variables que guardan la informacion del usuario
  // ---------------------------------------------------------------------------
  const [user, setUser] = React.useState<User | null>(null)       // Usuario de Supabase
  const [profile, setProfile] = React.useState<Profile | null>(null) // Perfil de BD
  const [wallet, setWallet] = React.useState<Wallet | null>(null)    // Billetera de BD
  const [loading, setLoading] = React.useState(true)                 // Estado de carga

  // ---------------------------------------------------------------------------
  // REFS - Referencias para evitar "stale closures" en callbacks
  // ---------------------------------------------------------------------------
  // Problema: Cuando usas una variable de estado en un callback async,
  // el callback puede tener una version "vieja" de la variable.
  // Solucion: Usar refs que siempre tienen el valor actual.
  const userRef = React.useRef(user)
  const walletRef = React.useRef(wallet)

  // Mantener las refs sincronizadas con el estado
  React.useEffect(() => {
    userRef.current = user
  }, [user])

  React.useEffect(() => {
    walletRef.current = wallet
  }, [wallet])

  // ---------------------------------------------------------------------------
  // fetchUserData - Carga el perfil y billetera del usuario desde Supabase
  // ---------------------------------------------------------------------------
  const fetchUserData = React.useCallback(async (userId: string) => {
    try {
      // Promise.all ejecuta ambas consultas en paralelo (mas rapido)
      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("wallets").select("*").eq("user_id", userId).single(),
      ])

      // Guardar los datos en el estado
      if (profileRes.data) setProfile(profileRes.data)
      if (walletRes.data) setWallet(walletRes.data)
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // refreshWallet - Actualiza el balance del usuario
  // ---------------------------------------------------------------------------
  // IMPORTANTE: Usa fetch() directo en lugar del cliente Supabase
  // porque el cliente Supabase se colgaba en Vercel (ver wallet.ts para detalles)
  const refreshWallet = React.useCallback(async () => {
    const currentUser = userRef.current // Usar ref para evitar stale closure
    if (!currentUser) return // Si no hay usuario, no hacer nada

    try {
      // Obtener las variables de entorno de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // ---------------------------------------------------------------------------
      // CLAVE: Obtener el JWT access_token del localStorage
      // ---------------------------------------------------------------------------
      // Sin este token, Supabase RLS no sabe quien es el usuario y retorna []
      let accessToken = supabaseKey || ''
      if (typeof window !== 'undefined') {
        try {
          // La key de Supabase en localStorage es: sb-{project-ref}-auth-token
          const storageKey = `sb-${new URL(supabaseUrl || '').hostname.split('.')[0]}-auth-token`
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            // El token JWT esta en la propiedad access_token
            accessToken = parsed?.access_token || supabaseKey || ''
          }
        } catch (e) {
          // Si falla, usar anon key (no funcionara con RLS)
        }
      }

      // ---------------------------------------------------------------------------
      // Llamada directa al REST API de Supabase
      // ---------------------------------------------------------------------------
      // URL: {supabase_url}/rest/v1/{tabla}?{filtros}
      const response = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${currentUser.id}&select=*`,
        {
          headers: {
            'apikey': supabaseKey || '',              // Siempre requerido
            'Authorization': `Bearer ${accessToken}`, // JWT para RLS
            'Content-Type': 'application/json',
          },
        }
      )

      // Si la respuesta es exitosa, actualizar el estado
      if (response.ok) {
        const data = await response.json()
        if (data?.[0]) {
          console.log('[refreshWallet] Updated balance:', data[0].balance)
          setWallet(data[0]) // Actualiza el estado -> UI se re-renderiza
        }
      }
    } catch (error) {
      // Ignorar AbortError (ocurre al cambiar de pestana, es normal)
      const err = error as { name?: string; message?: string }
      const isAbort = err?.name === 'AbortError' ||
        (err?.message?.includes('aborted') ?? false) ||
        (err?.message?.includes('signal is aborted') ?? false)

      if (!isAbort) {
        console.error("Error refreshing wallet:", error)
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // HELPER: Intenta cargar sesion desde localStorage directamente
  // ---------------------------------------------------------------------------
  // A veces onAuthStateChange dispara INITIAL_SESSION antes de que localStorage
  // este listo. Este helper lee directamente de localStorage como fallback.
  const tryLoadFromLocalStorage = React.useCallback(async () => {
    if (typeof window === 'undefined') return null

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) return null

      const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
      const stored = localStorage.getItem(storageKey)

      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.user?.id) {
          console.log('[AuthProvider] Found user in localStorage:', parsed.user.id)
          return parsed.user as User
        }
      }
    } catch (e) {
      console.log('[AuthProvider] Could not read localStorage:', e)
    }
    return null
  }, [])

  // ---------------------------------------------------------------------------
  // EFFECT: Inicializar autenticacion al montar el componente
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    let mounted = true // Para evitar updates despues de desmontar
    let initialSessionProcessed = false // Track si ya procesamos INITIAL_SESSION

    // ---------------------------------------------------------------------------
    // Suscribirse a cambios de autenticacion PRIMERO
    // ---------------------------------------------------------------------------
    // onAuthStateChange dispara INITIAL_SESSION cuando la sesion esta lista
    // Esto es mas confiable que getSession() porque espera a que localStorage este listo
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id || 'no user')

        if (!mounted) return // Evitar updates si el componente se desmonto

        if (session?.user) {
          setUser(session.user)
          // Cargar datos del usuario
          await fetchUserData(session.user.id)
          if (event === 'INITIAL_SESSION') {
            initialSessionProcessed = true
            setLoading(false)
          }
        } else if (event === 'INITIAL_SESSION') {
          // ---------------------------------------------------------------------------
          // FALLBACK: Si INITIAL_SESSION no tiene sesion, intentar localStorage
          // ---------------------------------------------------------------------------
          // Esto ocurre cuando onAuthStateChange dispara antes de que localStorage
          // este completamente restaurado. Esperamos un poco y reintentamos.
          console.log('[AuthProvider] INITIAL_SESSION without user, trying localStorage fallback...')

          // Dar un pequeño delay para que localStorage termine de cargar
          await new Promise(resolve => setTimeout(resolve, 100))

          const localUser = await tryLoadFromLocalStorage()
          if (localUser && mounted) {
            console.log('[AuthProvider] Loaded user from localStorage fallback')
            setUser(localUser)
            await fetchUserData(localUser.id)
          } else if (mounted) {
            // Realmente no hay sesion
            setUser(null)
            setProfile(null)
            setWallet(null)
          }

          initialSessionProcessed = true
          if (mounted) setLoading(false)
        } else {
          // SIGNED_OUT u otro evento sin sesion
          setUser(null)
          setProfile(null)
          setWallet(null)
        }
      }
    )

    // Fallback: Si despues de 3 segundos aun no hay INITIAL_SESSION, desbloquear
    // Esto evita que la app se quede cargando indefinidamente si hay un error
    const timeoutId = setTimeout(async () => {
      if (mounted && !initialSessionProcessed) {
        console.log('[AuthProvider] Timeout: trying localStorage as last resort')
        const localUser = await tryLoadFromLocalStorage()
        if (localUser && mounted) {
          setUser(localUser)
          await fetchUserData(localUser.id)
        }
        if (mounted) setLoading(false)
      }
    }, 3000)

    // Cleanup: desuscribirse y cancelar timeout cuando el componente se desmonta
    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [fetchUserData, tryLoadFromLocalStorage])

  // ---------------------------------------------------------------------------
  // EFFECT: Manejar Alt+Tab (visibilidad de la pestana)
  // ---------------------------------------------------------------------------
  // Cuando el usuario vuelve a la pestana, refrescar sesion y wallet
  // Esto evita problemas con tokens expirados
  React.useEffect(() => {
    // Helper para detectar AbortError
    const isAbortError = (error: unknown): boolean => {
      if (!error || typeof error !== 'object') return false
      const err = error as { name?: string; message?: string }
      return (
        err.name === 'AbortError' ||
        (err.message?.includes('aborted') ?? false) ||
        (err.message?.includes('signal is aborted') ?? false)
      )
    }

    // Handler cuando la pestana se vuelve visible
    const handleVisibilityChange = async () => {
      if (!document.hidden && userRef.current) {
        try {
          await supabase.auth.refreshSession() // Refrescar token
          await refreshWallet()                 // Refrescar balance
        } catch (error) {
          if (!isAbortError(error)) {
            console.error("Error refreshing on visibility change:", error)
          }
        }
      }
    }

    // Handler cuando la ventana recibe foco
    const handleFocus = async () => {
      if (userRef.current) {
        try {
          await supabase.auth.refreshSession()
          await refreshWallet()
        } catch (error) {
          if (!isAbortError(error)) {
            console.error("Error refreshing on focus:", error)
          }
        }
      }
    }

    // Agregar event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    // Cleanup: remover event listeners
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [refreshWallet])

  // ---------------------------------------------------------------------------
  // signIn - Iniciar sesion con email y password
  // ---------------------------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      // Retornar error o null si fue exitoso
      return { error: error ? new Error(error.message) : null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // ---------------------------------------------------------------------------
  // signUp - Registrar nuevo usuario
  // ---------------------------------------------------------------------------
  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // data se guarda en raw_user_meta_data
          // El trigger de Supabase lo usa para crear el profile
          data: { username },
        },
      })
      return { error: error ? new Error(error.message) : null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // ---------------------------------------------------------------------------
  // signOut - Cerrar sesion
  // ---------------------------------------------------------------------------
  const signOut = async () => {
    try {
      // Limpiar localStorage de Supabase (tokens, sesion, etc)
      if (typeof window !== "undefined") {
        const keysToRemove = Object.keys(localStorage).filter(
          (key) =>
            key.startsWith("sb-") ||
            key.startsWith("supabase") ||
            key.includes("auth-token")
        )
        keysToRemove.forEach((key) => localStorage.removeItem(key))
      }

      // Cerrar sesion en Supabase (scope: "local" = solo este dispositivo)
      await supabase.auth.signOut({ scope: "local" })

      // Limpiar estado
      setUser(null)
      setProfile(null)
      setWallet(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER - Proveer el contexto a los hijos
  // ---------------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        loading,
        signIn,
        signUp,
        signOut,
        refreshWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================================
// HOOK: useAuth - Para usar el contexto en cualquier componente
// =============================================================================
// Uso: const { user, wallet, signIn, signOut } = useAuth()
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
