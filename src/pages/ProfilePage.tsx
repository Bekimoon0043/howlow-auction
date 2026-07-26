import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { maskPhone } from '@/lib/format'
import i18n from '@/lib/i18n'
import { Moon, Sun, Globe, LogOut, ShieldCheck, Trophy, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function ProfilePage() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const signOut = useAuthStore(s => s.signOut)
  const isAdmin = useAuthStore(s => s.isAdmin)
  const { dark, toggle } = useThemeStore()
  const [copied, setCopied] = useState(false)

  const switchLang = () => {
    const next = i18n.language === 'am' ? 'en' : 'am'
    i18n.changeLanguage(next)
    localStorage.setItem('locale', next)
  }

  const copyReferral = () => {
    if (!profile?.referral_code) return
    navigator.clipboard.writeText(profile.referral_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!profile) return null

  const initials = (profile.display_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {/* Avatar + name */}
      <div className="card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700
                        flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-700/30">
          <span className="text-white text-2xl font-black">{initials}</span>
        </div>
        <p className="font-bold text-lg">{profile.display_name}</p>
        <p className="text-muted-foreground text-sm">{maskPhone(profile.phone_number)}</p>

        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/8">
          <div className="text-center">
            <p className="text-xl font-black text-brand-600 dark:text-brand-400">{profile.wins_count}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          {profile.referral_code && (
            <div className="text-center">
              <button
                onClick={copyReferral}
                className="flex items-center gap-1.5 font-mono text-sm font-semibold
                           bg-gray-100 dark:bg-white/8 px-3 py-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/12 transition"
              >
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                {profile.referral_code}
              </button>
              <p className="text-xs text-muted-foreground mt-1">Referral Code</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="card divide-y divide-gray-100 dark:divide-white/6 overflow-hidden">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/4 transition text-left"
        >
          <span className="flex items-center gap-3 font-medium text-sm">
            {dark ? <Moon size={17} className="text-brand-500" /> : <Sun size={17} className="text-amber-500" />}
            {dark ? t('dark_mode') : t('light_mode')}
          </span>
          <span className="text-xs text-muted-foreground">{dark ? 'On' : 'Off'}</span>
        </button>

        <button
          onClick={switchLang}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/4 transition text-left"
        >
          <span className="flex items-center gap-3 font-medium text-sm">
            <Globe size={17} className="text-brand-500" />
            {t('language')}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">
            {i18n.language === 'am' ? 'አማርኛ' : 'English'}
          </span>
        </button>

        {isAdmin && (
          <Link
            to="/admin"
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/4 transition"
          >
            <span className="flex items-center gap-3 font-medium text-sm">
              <ShieldCheck size={17} className="text-brand-500" />
              Admin Dashboard
            </span>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>
        )}
      </div>

      {/* Joined */}
      {profile.created_at && (
        <p className="text-center text-xs text-muted-foreground">
          Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      )}

      {/* Logout */}
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                   border border-red-200 dark:border-red-500/20
                   text-red-600 dark:text-red-400 font-semibold text-sm
                   hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-[0.98]"
      >
        <LogOut size={16} />
        {t('logout')}
      </button>
    </div>
  )
}
