import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { maskPhone } from '@/lib/format'

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])

  const search = async () => {
    let query = supabase.from('profiles').select('*').limit(20)
    if (q.startsWith('+') || q.startsWith('09') || q.startsWith('07')) {
      query = query.ilike('phone_number', `%${q.replace(/^0/, '')}%`)
    } else {
      query = query.ilike('display_name', `%${q}%`)
    }
    const { data } = await query
    setUsers(data || [])
  }

  const toggleBan = async (id: string, banned: boolean) => {
    await supabase.from('profiles').update({ is_banned: !banned }).eq('id', id)
    search()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="flex gap-2 max-w-md">
        <input
          className="input-field"
          placeholder="Phone or name"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button className="btn-primary" onClick={search}>Search</button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="card p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{u.display_name}</p>
              <p className="text-sm text-gray-500">{maskPhone(u.phone_number)}</p>
              {u.is_banned && <span className="text-xs text-red-500 font-medium">BANNED</span>}
            </div>
            <button className="btn-secondary text-sm" onClick={() => toggleBan(u.id, u.is_banned)}>
              {u.is_banned ? 'Unban' : 'Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
