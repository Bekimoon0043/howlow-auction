import { create } from 'zustand'
import { supabase, phoneToSyntheticEmail, normalizePhone } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

/** Always returns a non-empty string from any error shape */
function extractMessage(e: any): string {
  if (!e) return 'error_generic'
  if (typeof e === 'string' && e.trim()) return e
  if (typeof e.message === 'string' && e.message.trim() && e.message !== '{}') return e.message
  if (typeof e.error_description === 'string' && e.error_description.trim()) return e.error_description
  if (typeof e.msg === 'string' && e.msg.trim()) return e.msg
  return 'error_generic'
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
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user, session })
      await get().refreshProfile()
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, session })
      if (session?.user) await get().refreshProfile()
      else set({ profile: null, isAdmin: false })
    })
  },

  signUp: async (phone, password, displayName) => {
    try {
      const normalized = normalizePhone(phone)
      const email = phoneToSyntheticEmail(normalized)

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', normalized)
        .maybeSingle()

      if (existing) return { error: 'account_exists' }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: normalized,
            display_name: displayName || 'User'
          }
        }
      })

      if (error) return { error: extractMessage(error) }
      if (data.user) {
        set({ user: data.user, session: data.session })
        await get().refreshProfile()
      }
      return {}
    } catch (e: any) {
      return { error: extractMessage(e) }
    }
  },

  signIn: async (phone, password) => {
    try {
      const normalized = normalizePhone(phone)
      const email = phoneToSyntheticEmail(normalized)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) return { error: extractMessage(error) }
      set({ user: data.user, session: data.session })
      await get().refreshProfile()
      return {}
    } catch (e: any) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: adminRow } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    set({
      profile: profile as Profile | null,
      isAdmin: !!adminRow
    })
  }
}))
