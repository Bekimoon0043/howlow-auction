import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
      'Set them in Replit Secrets, then restart the app.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

/** Convert Ethiopian phone to synthetic email for Supabase Auth */
export function phoneToSyntheticEmail(phone: string): string {
  const normalized = phone.replace(/\s+/g, '').replace(/^\+/, '')
  return `${normalized}@howlow.app`
}

/** Normalize user input to E.164 +251... */
export function normalizePhone(input: string): string {
  let cleaned = input.replace(/[^0-9+]/g, '')
  if (/^09\d{8}$/.test(cleaned)) cleaned = '+251' + cleaned.slice(1)
  else if (/^07\d{8}$/.test(cleaned)) cleaned = '+251' + cleaned.slice(1)
  else if (/^251[79]\d{8}$/.test(cleaned)) cleaned = '+' + cleaned
  else if (!/^\+251[79]\d{8}$/.test(cleaned)) {
    throw new Error('Invalid Ethiopian mobile number')
  }
  return cleaned
}
