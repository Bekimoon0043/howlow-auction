import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { maskPhone } from '@/lib/format'
import i18n from '@/lib/i18n'

export default function ProfilePage() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const signOut = useAuthStore(s => s.signOut)
  const isAdmin = useAuthStore(s => s.isAdmin)
  const { dark, toggle } = useThemeStore()

  const switchLang = () => {
    const next = i18n.language === 'am' ? 'en' : 'am'
    i18n.changeLanguage(next)
    localStorage.setItem('locale', next)
  }

  if (!profile) return null

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">{t('profile')}</h1>

      <div className="card p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500">{t('display_name')}</p>
          <p className="font-medium">{profile.display_name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('phone')}</p>
          <p className="font-medium">{maskPhone(profile.phone_number)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Wins</p>
          <p className="font-medium">{profile.wins_count}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Referral Code</p>
          <p className="font-mono">{profile.referral_code}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Joined</p>
          <p>{new Date(profile.created_at || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <button className="btn-secondary w-full" onClick={toggle}>
          {dark ? t('light_mode') : t('dark_mode')}
        </button>
        <button className="btn-secondary w-full" onClick={switchLang}>
          {t('language')}: {i18n.language === 'am' ? 'አማርኛ' : 'English'}
        </button>
        {isAdmin && (
          <a href="/admin" className="btn-primary block text-center">Admin Dashboard</a>
        )}
        <button className="btn-secondary w-full text-red-600" onClick={() => signOut()}>
          {t('logout')}
        </button>
      </div>
    </div>
  )
}
