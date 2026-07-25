import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Gavel, Wallet, ListOrdered, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const nav = [
  { to: '/', icon: Home, key: 'home' },
  { to: '/auctions', icon: Gavel, key: 'auctions' },
  { to: '/wallet', icon: Wallet, key: 'wallet' },
  { to: '/my-bids', icon: ListOrdered, key: 'my_bids' },
  { to: '/profile', icon: User, key: 'profile' }
]

export default function AppLayout() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-brand-700 text-lg">{t('app_name')}</span>
          {profile && (
            <span className="text-sm text-gray-500 truncate max-w-[140px]">
              {profile.display_name}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 md:hidden">
        <div className="flex justify-around h-16">
          {nav.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 text-xs gap-0.5 ${
                  isActive ? 'text-brand-700' : 'text-gray-500'
                }`
              }
            >
              <Icon size={22} />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
