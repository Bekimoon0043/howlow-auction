import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, auctions: 0, bids: 0, revenue: 0 })

  useEffect(() => {
    ;(async () => {
      const [{ count: users }, { count: auctions }, { count: bids }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }),
        supabase.from('bids').select('*', { count: 'exact', head: true })
      ])
      setStats({
        users: users || 0,
        auctions: auctions || 0,
        bids: bids || 0,
        revenue: 0
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
          <p className="text-sm text-gray-500">Currency</p>
          <p className="text-2xl font-bold">ETB</p>
        </div>
      </div>
    </div>
  )
}
