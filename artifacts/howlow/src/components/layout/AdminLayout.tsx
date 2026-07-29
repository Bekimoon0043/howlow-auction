import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Gavel, Users, Wallet, Settings, Menu, X, Bell, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const links = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products',  icon: Package,         label: 'Products' },
  { to: '/admin/auctions',  icon: Gavel,           label: 'Auctions' },
  { to: '/admin/users',     icon: Users,           label: 'Users' },
  { to: '/admin/wallet',    icon: Wallet,          label: 'Wallet' },
  { to: '/admin/settings',  icon: Settings,        label: 'Settings' },
]

export default function AdminLayout() {
  const [pendingDeposits, setPendingDeposits] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const signOut = useAuthStore(state => state.signOut)

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from('deposit_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingDeposits(count || 0)
    }
    load()
    const ch = supabase
      .channel('admin-deposits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const NavItem = ({ to, icon: Icon, label, end }: { to: string; icon: any; label: string; end?: boolean }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/20'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/8'
        }`
      }
    >
      <Icon size={17} />
      <span className="flex-1">{label}</span>
      {label === 'Wallet' && pendingDeposits > 0 && (
        <span className="text-[11px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
          {pendingDeposits}
        </span>
      )}
    </NavLink>
  )

  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 border-r border-white/8">
        <div className="p-5 border-b border-white/8">
          <Link to="/admin" className="block">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">HowLow</p>
            <p className="text-lg font-bold text-white">Admin Panel</p>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(l => <NavItem key={l.to} {...l} end={l.to === '/admin'} />)}
        </nav>
        
        <div className="p-3 border-t border-white/8 space-y-1">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition">
            ← View user app
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-gray-950 border-b border-white/8
                      flex items-center justify-between px-4">
        <Link to="/admin" className="font-bold text-white">HowLow Admin</Link>
        <div className="flex items-center gap-3">
          {pendingDeposits > 0 && (
            <Link to="/admin/wallet" className="relative">
              <Bell size={20} className="text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold
                               flex items-center justify-center text-white">{pendingDeposits}</span>
            </Link>
          )}
          <button onClick={() => setMobileOpen(o => !o)} className="p-1.5 rounded-xl hover:bg-white/8 transition">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 inset-x-0 z-40 bg-gray-950 border-b border-white/8 p-3 space-y-1">
          {links.map(l => <NavItem key={l.to} {...l} end={l.to === '/admin'} />)}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
          <Link to="/" className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition">← User app</Link>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-0 overflow-auto">
        <div className="p-5 md:p-8 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
