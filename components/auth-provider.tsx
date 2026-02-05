"use client"

import * as React from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { Profile, Wallet } from "@/types/database"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  wallet: Wallet | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshWallet: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [wallet, setWallet] = React.useState<Wallet | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Refs to prevent stale closures
  const userRef = React.useRef(user)
  const walletRef = React.useRef(wallet)

  React.useEffect(() => {
    userRef.current = user
  }, [user])

  React.useEffect(() => {
    walletRef.current = wallet
  }, [wallet])

  const fetchUserData = React.useCallback(async (userId: string) => {
    try {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("wallets").select("*").eq("user_id", userId).single(),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (walletRes.data) setWallet(walletRes.data)
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [])

  const refreshWallet = React.useCallback(async () => {
    const currentUser = userRef.current
    if (!currentUser) return

    try {
      // Use fetch directly to bypass Supabase client timeout issues on Vercel
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Get user's access token from localStorage
      let accessToken = supabaseKey || ''
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `sb-${new URL(supabaseUrl || '').hostname.split('.')[0]}-auth-token`
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            accessToken = parsed?.access_token || supabaseKey || ''
          }
        } catch (e) {
          // Use anon key as fallback
        }
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${currentUser.id}&select=*`,
        {
          headers: {
            'apikey': supabaseKey || '',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data?.[0]) {
          console.log('[refreshWallet] Updated balance:', data[0].balance)
          setWallet(data[0])
        }
      }
    } catch (error) {
      // Check if it's an abort error (expected when switching tabs)
      const err = error as { name?: string; message?: string }
      const isAbort = err?.name === 'AbortError' ||
        (err?.message?.includes('aborted') ?? false) ||
        (err?.message?.includes('signal is aborted') ?? false)

      if (!isAbort) {
        console.error("Error refreshing wallet:", error)
      }
    }
  }, [])

  // Initialize auth state
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await fetchUserData(session.user.id)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event)

        if (session?.user) {
          setUser(session.user)
          await fetchUserData(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setWallet(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserData])

  // Handle visibility change for session refresh (Alt+Tab recovery)
  // ALWAYS refresh when tab becomes visible to ensure connection is alive
  React.useEffect(() => {
    // Check if error is an AbortError (expected when switching tabs)
    const isAbortError = (error: unknown): boolean => {
      if (!error || typeof error !== 'object') return false
      const err = error as { name?: string; message?: string }
      return (
        err.name === 'AbortError' ||
        (err.message?.includes('aborted') ?? false) ||
        (err.message?.includes('signal is aborted') ?? false)
      )
    }

    const handleVisibilityChange = async () => {
      if (!document.hidden && userRef.current) {
        // Tab is now visible - refresh session and wallet
        try {
          await supabase.auth.refreshSession()
          await refreshWallet()
        } catch (error) {
          // Silently ignore abort errors (expected when switching tabs)
          if (!isAbortError(error)) {
            console.error("Error refreshing on visibility change:", error)
          }
        }
      }
    }

    const handleFocus = async () => {
      if (userRef.current) {
        try {
          await supabase.auth.refreshSession()
          await refreshWallet()
        } catch (error) {
          // Silently ignore abort errors
          if (!isAbortError(error)) {
            console.error("Error refreshing on focus:", error)
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [refreshWallet])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error ? new Error(error.message) : null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })
      return { error: error ? new Error(error.message) : null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      // Clear local storage keys related to Supabase
      if (typeof window !== "undefined") {
        const keysToRemove = Object.keys(localStorage).filter(
          (key) =>
            key.startsWith("sb-") ||
            key.startsWith("supabase") ||
            key.includes("auth-token")
        )
        keysToRemove.forEach((key) => localStorage.removeItem(key))
      }

      await supabase.auth.signOut({ scope: "local" })
      setUser(null)
      setProfile(null)
      setWallet(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

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

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
