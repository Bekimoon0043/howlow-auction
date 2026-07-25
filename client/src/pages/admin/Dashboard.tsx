import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    auctions: 0,
    bids: 0,
    pendingDeposits: 0,
    pendingDepositsAmount: 0,
    totalWalletBalance: 0
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
        supabase.from('wallets').select('balance')
      ])

      const pendingDepositsAmount = (pending || []).reduce((sum, r: any) => sum + Number(r.amount || 0), 0)
      const totalWalletBalance = (wallets || []).reduce((sum, w: any) => sum + Number(w.balance || 0), 0)

      setStats({
        users: users || 0,
        auctions: auctions || 0,
        bids: bids || 0,
        pendingDeposits: pending?.length || 0,
        pendingDepositsAmount,
        totalWalletBalance
      })
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-2xl font-bold">{stats.users}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Auctions</p>
          <p className="text-2xl font-bold">{stats.auctions}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Bids</p>
          <p className="text-2xl font-bold">{stats.bids}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Wallet Balance</p>
          <p className="text-2xl font-bold">{formatETB(stats.totalWalletBalance)}</p>
        </div>
      </div>

      <Link
        to="/admin/wallet"
        className="card p-4 flex items-center justify-between hover:border-brand-600 border border-transparent transition-colors"
      >
        <div>
          <p className="text-sm text-gray-500">Pending Payment / Deposit Requests</p>
          <p className="text-2xl font-bold text-brand-700">
            {stats.pendingDeposits} <span className="text-sm font-normal text-gray-500">({formatETB(stats.pendingDepositsAmount)} total)</span>
          </p>
        </div>
        <span className="btn-primary text-sm">Review &amp; Approve →</span>
      </Link>
    </div>
  )
}
