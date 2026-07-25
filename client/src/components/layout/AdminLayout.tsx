import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Gavel, Users, Wallet, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/auctions', icon: Gavel, label: 'Auctions' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' }
]

export default function AdminLayout() {
  const [pendingDeposits, setPendingDeposits] = useState(0)

  useEffect(() => {
    const loadCount = async () => {
      const { count } = await supabase
        .from('deposit_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingDeposits(count || 0)
    }
    loadCount()

    // Keep the badge live as new payment requests come in
    const channel = supabase
      .channel('admin-deposit-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, loadCount)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
              <span className="flex-1">{label}</span>
              {label === 'Wallet' && pendingDeposits > 0 && (
                <span className="text-xs bg-red-600 text-white rounded-full px-2 py-0.5">{pendingDeposits}</span>
              )}
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
