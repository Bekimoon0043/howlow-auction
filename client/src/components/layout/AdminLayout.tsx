import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Gavel, Users, Wallet, Settings } from 'lucide-react'

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/auctions', icon: Gavel, label: 'Auctions' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' }
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 font-bold text-lg border-b border-gray-700">HowLow Admin</div>
        <nav className="flex-1 p-2 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive ? 'bg-brand-700' : 'hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
