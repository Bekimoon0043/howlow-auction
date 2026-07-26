import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'
import { Users, Gavel, TrendingUp, Wallet, Package, ArrowRight, Bell } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0, auctions: 0, bids: 0,
    pendingDeposits: 0, pendingDepositsAmount: 0, totalWalletBalance: 0
  })

  useEffect(() => {
    ;(async () => {
      const [
        { count: users },
        { count: auctions },
        { count: bids },
        { data: pending },
        { data: wallets }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }),
        supabase.from('bids').select('*', { count: 'exact', head: true }),
        supabase.from('deposit_requests').select('amount').eq('status', 'pending'),
        supabase.from('wallets').select('balance'),
      ])
      setStats({
        users: users || 0,
        auctions: auctions || 0,
        bids: bids || 0,
        pendingDeposits: pending?.length || 0,
        pendingDepositsAmount: (pending || []).reduce((s, r: any) => s + Number(r.amount || 0), 0),
        totalWalletBalance: (wallets || []).reduce((s, w: any) => s + Number(w.balance || 0), 0),
      })
    })()
  }, [])

  const statCards = [
    { label: 'Total Users',       value: stats.users,    icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { label: 'Total Auctions',    value: stats.auctions, icon: Gavel,      color: 'text-brand-400',  bg: 'bg-brand-400/10' },
    { label: 'Total Bids',        value: stats.bids,     icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Platform Balance',  value: formatETB(stats.totalWalletBalance), icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10', isETB: true },
  ]

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">HowLow platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending deposits alert */}
      <Link
        to="/admin/wallet"
        className={`flex items-center justify-between rounded-2xl p-4 border transition-all
          ${stats.pendingDeposits > 0
            ? 'bg-amber-400/10 border-amber-400/30 hover:border-amber-400/60'
            : 'bg-white/5 border-white/10 hover:border-white/20'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            ${stats.pendingDeposits > 0 ? 'bg-amber-400/20' : 'bg-white/8'}`}>
            <Bell size={18} className={stats.pendingDeposits > 0 ? 'text-amber-400' : 'text-gray-500'} />
          </div>
          <div>
            <p className={`font-bold text-sm ${stats.pendingDeposits > 0 ? 'text-amber-300' : 'text-gray-400'}`}>
              {stats.pendingDeposits > 0
                ? `${stats.pendingDeposits} Pending Deposit Request${stats.pendingDeposits > 1 ? 's' : ''}`
                : 'No Pending Deposits'}
            </p>
            {stats.pendingDeposits > 0 && (
              <p className="text-xs text-amber-400/70 mt-0.5">
                {formatETB(stats.pendingDepositsAmount)} total requested
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.pendingDeposits > 0 && (
            <span className="bg-amber-400 text-black text-xs font-black px-2.5 py-1 rounded-full">
              {stats.pendingDeposits}
            </span>
          )}
          <ArrowRight size={16} className="text-gray-500" />
        </div>
      </Link>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/admin/products"
            className="flex items-center justify-between bg-white/5 hover:bg-white/8
                       border border-white/10 hover:border-brand-500/30
                       rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-400/10 rounded-xl flex items-center justify-center">
                <Package size={16} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Add Product</p>
                <p className="text-xs text-gray-500">Upload item for auction</p>
              </div>
            </div>
            <ArrowRight size={15} className="text-gray-600 group-hover:text-brand-400 transition" />
          </Link>

          <Link to="/admin/auctions"
            className="flex items-center justify-between bg-white/5 hover:bg-white/8
                       border border-white/10 hover:border-brand-500/30
                       rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-400/10 rounded-xl flex items-center justify-center">
                <Gavel size={16} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Create Auction</p>
                <p className="text-xs text-gray-500">Publish for bidding</p>
              </div>
            </div>
            <ArrowRight size={15} className="text-gray-600 group-hover:text-brand-400 transition" />
          </Link>
        </div>
      </div>
    </div>
  )
}
