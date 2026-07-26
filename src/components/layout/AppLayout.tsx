import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Gavel, Wallet, ListOrdered, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const nav = [
  { to: '/',        icon: Home,        key: 'home' },
  { to: '/auctions',icon: Gavel,       key: 'auctions' },
  { to: '/wallet',  icon: Wallet,      key: 'wallet' },
  { to: '/my-bids', icon: ListOrdered, key: 'my_bids' },
  { to: '/profile', icon: User,        key: 'profile' },
]

export default function AppLayout() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl
                         border-b border-gray-100 dark:border-white/6">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-xl tracking-tight
                           bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            {t('app_name')}
          </span>
          {profile && (
            <span className="text-sm text-muted-foreground truncate max-w-[150px] font-medium">
              {profile.display_name}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5">
        <Outlet />
      </main>

      {/* Floating bottom nav */}
      <nav className="fixed bottom-4 inset-x-4 z-40 md:hidden">
        <div className="max-w-sm mx-auto bg-white/80 dark:bg-gray-900/90 backdrop-blur-2xl
                        border border-gray-200/60 dark:border-white/10
                        rounded-2xl shadow-xl shadow-black/20 px-2">
          <div className="flex justify-around h-16">
            {nav.map(({ to, icon: Icon, key }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 gap-0.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-500/15' : ''}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {t(key)}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Desktop side nav */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-56 pt-16
                      border-r border-gray-100 dark:border-white/6 bg-white dark:bg-gray-950">
        <nav className="p-3 space-y-1">
          {nav.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {t(key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
