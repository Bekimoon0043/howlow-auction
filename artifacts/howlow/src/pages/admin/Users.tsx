import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { maskPhone } from '@/lib/format'
import { Users as UsersIcon, Search, Ban, ShieldCheck, Trophy } from 'lucide-react'

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const search = async () => {
    setLoading(true)
    setSearched(true)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20)
    if (q.trim()) {
      if (q.startsWith('+') || q.startsWith('09') || q.startsWith('07')) {
        query = query.ilike('phone_number', `%${q.replace(/^0/, '')}%`)
      } else {
        query = query.ilike('display_name', `%${q}%`)
      }
    }
    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  const toggleBan = async (id: string, banned: boolean) => {
    setBusyId(id)
    await supabase.from('profiles').update({ is_banned: !banned }).eq('id', id)
    setBusyId(null)
    search()
  }

  const initials = (name: string) => (name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <UsersIcon className="text-brand-400" size={22} />
          Users
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Search, review, and manage accounts</p>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-3.5 py-3 text-sm text-gray-100
                       placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
            placeholder="Phone or name — leave blank to list recent users"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
        </div>
        <button
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400
                     text-white font-semibold text-sm px-5 rounded-xl transition-all disabled:opacity-50"
          onClick={search}
          disabled={loading}
        >
          {loading ? '…' : 'Search'}
        </button>
      </div>

      <div className="space-y-2">
        {!searched && (
          <p className="text-sm text-gray-500 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            Search by phone number or name to find a user.
          </p>
        )}
        {searched && !loading && users.length === 0 && (
          <p className="text-sm text-gray-500 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            No users found.
          </p>
        )}
        {users.map(u => (
          <div key={u.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
              ${u.is_banned ? 'bg-red-400/15 text-red-400' : 'bg-brand-400/15 text-brand-400'}`}>
              {initials(u.display_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-white text-sm truncate">{u.display_name || 'Unnamed'}</p>
                {u.is_banned && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">BANNED</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span>{maskPhone(u.phone_number)}</span>
                {u.wins_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Trophy size={11} /> {u.wins_count} win{u.wins_count > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0
                ${u.is_banned
                  ? 'bg-brand-500/15 text-brand-400 hover:bg-brand-500/25'
                  : 'bg-red-400/10 text-red-400 hover:bg-red-400/20'}`}
              onClick={() => toggleBan(u.id, u.is_banned)}
              disabled={busyId === u.id}
            >
              {u.is_banned ? <ShieldCheck size={13} /> : <Ban size={13} />}
              {busyId === u.id ? '…' : u.is_banned ? 'Unban' : 'Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
