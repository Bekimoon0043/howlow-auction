import { create } from 'zustand'
import { supabase, phoneToSyntheticEmail, normalizePhone } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

/** Always returns a non-empty, human-readable string from any error shape */
function extractMessage(e: any): string {
  if (!e) return 'error_generic'

  // Plain string
  if (typeof e === 'string') {
    const s = e.trim()
    if (!s || s === '{}' || s === '[object Object]') return 'error_generic'
    return s
  }

  // Supabase AuthError / PostgrestError style
  const candidates = [
    e.message,
    e.error_description,
    e.msg,
    e.error,
    e.statusText,
    typeof e.details === 'string' ? e.details : null,
    typeof e.hint === 'string' ? e.hint : null,
  ]

  for (const c of candidates) {
    if (typeof c === 'string') {
      const s = c.trim()
      if (s && s !== '{}' && s !== '[object Object]') return s
    }
  }

  // Nested error
  if (e.error && typeof e.error === 'object') {
    return extractMessage(e.error)
  }

  // Network / fetch failures
  if (e.name === 'AuthRetryableFetchError' || e.name === 'TypeError') {
    return 'error_connection'
  }

  // Common Supabase codes
  if (e.status === 400 || e.code === 'invalid_credentials') return 'invalid_credentials'
  if (e.status === 422 || e.code === 'user_already_exists') return 'account_exists'
  if (e.code === 'email_not_confirmed') return 'email_not_confirmed'

  return 'error_generic'
}

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return !!(
    url &&
    key &&
    !url.includes('placeholder') &&
    key !== 'placeholder' &&
    url.startsWith('http')
  )
}

interface Profile {
  id: string
  phone_number: string
  display_name: string | null
  is_banned: boolean
  is_frozen: boolean
  locale: string
  wins_count: number
  referral_code: string | null
  created_at?: string
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  initialize: () => Promise<void>
  signUp: (phone: string, password: string, displayName?: string) => Promise<{ error?: string }>
  signIn: (phone: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,

  initialize: async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('[auth] Supabase env vars missing – set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
        set({ loading: false })
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.warn('[auth] getSession error', error)

      if (session?.user) {
        set({ user: session.user, session })
        await get().refreshProfile()
      }
    } catch (e) {
      console.warn('[auth] initialize failed', e)
    } finally {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, session })
      if (session?.user) await get().refreshProfile()
      else set({ profile: null, isAdmin: false })
    })
  },

  signUp: async (phone, password, displayName) => {
    try {
      if (!isSupabaseConfigured()) {
        return { error: 'error_supabase_config' }
      }

      let normalized: string
      try {
        normalized = normalizePhone(phone)
      } catch {
        return { error: 'invalid_phone' }
      }

      if (!password || password.length < 6) {
        return { error: 'password_too_short' }
      }

      const email = phoneToSyntheticEmail(normalized)

      // Check if profile already exists for this phone
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', normalized)
        .maybeSingle()

      if (checkError) {
        console.error('[auth] profile check failed', checkError)
        // Don't block signup on read errors – let Auth decide
      } else if (existing) {
        return { error: 'account_exists' }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: normalized,
            display_name: displayName || 'User',
          },
        },
      })

      if (error) {
        const msg = extractMessage(error)
        // Map common Auth messages
        if (/already registered|already been registered|user already exists/i.test(msg)) {
          return { error: 'account_exists' }
        }
        if (/email not confirmed/i.test(msg)) {
          return { error: 'email_not_confirmed' }
        }
        return { error: msg }
      }

      if (data.user) {
        set({ user: data.user, session: data.session })
        // Profile is created by the DB trigger; give it a moment then refresh
        await new Promise((r) => setTimeout(r, 400))
        await get().refreshProfile()
      }

      // If email confirmation is still ON, session will be null
      if (data.user && !data.session) {
        return { error: 'email_not_confirmed' }
      }

      return {}
    } catch (e: any) {
      console.error('[auth] signUp exception', e)
      return { error: extractMessage(e) }
    }
  },

  signIn: async (phone, password) => {
    try {
      if (!isSupabaseConfigured()) {
        return { error: 'error_supabase_config' }
      }

      let normalized: string
      try {
        normalized = normalizePhone(phone)
      } catch {
        return { error: 'invalid_phone' }
      }

      const email = phoneToSyntheticEmail(normalized)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const msg = extractMessage(error)
        if (/invalid login credentials|invalid_credentials/i.test(msg)) {
          return { error: 'invalid_credentials' }
        }
        if (/email not confirmed/i.test(msg)) {
          return { error: 'email_not_confirmed' }
        }
        return { error: msg }
      }

      set({ user: data.user, session: data.session })
      await get().refreshProfile()
      return {}
    } catch (e: any) {
      console.error('[auth] signIn exception', e)
      return { error: extractMessage(e) }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null, isAdmin: false })
  },

  refreshProfile: async () => {
    const user = get().user
    if (!user) return

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.warn('[auth] refreshProfile profiles error', profileError)
      }

      const { data: adminRow } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      set({
        profile: (profile as Profile) ?? null,
        isAdmin: !!adminRow,
      })
    } catch (e) {
      console.warn('[auth] refreshProfile failed', e)
    }
  },
}))
