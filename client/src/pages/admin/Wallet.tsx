import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'

export default function AdminWallet() {
  const [phone, setPhone] = useState('')
  const [user, setUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [credits, setCredits] = useState('')
  const [msg, setMsg] = useState('')

  const find = async () => {
    const { data } = await supabase.from('profiles').select('*, wallets(balance), user_bid_credits(credits)').eq('phone_number', phone).maybeSingle()
    setUser(data)
    if (!data) setMsg('User not found')
  }

  const adjustBalance = async (type: 'admin_credit' | 'admin_debit') => {
    if (!user || !amount) return
    const { data, error } = await supabase.rpc('admin_adjust_wallet', {
      p_target_user: user.id,
      p_amount: parseFloat(amount),
      p_type: type,
      p_note: 'Manual admin adjustment'
    })
    if (error) setMsg(error.message)
    else {
      setMsg(`Success. New balance: ${data?.new_balance}`)
      find()
    }
  }

  const adjustCredits = async () => {
    if (!user || !credits) return
    const { data, error } = await supabase.rpc('admin_adjust_credits', {
      p_target_user: user.id,
      p_credits: parseInt(credits),
      p_note: 'Manual credit adjustment'
    })
    if (error) setMsg(error.message)
    else {
      setMsg(`Success. New credits: ${data?.new_credits}`)
      find()
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Wallet Management</h1>
      <div className="flex gap-2">
        <input className="input-field" placeholder="+2519xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} />
        <button className="btn-primary" onClick={find}>Find</button>
      </div>

      {user && (
        <div className="card p-4 space-y-4">
          <p className="font-medium">{user.display_name} · {user.phone_number}</p>
          <p>Balance: {formatETB(user.wallets?.balance ?? 0)}</p>
          <p>Credits: {user.user_bid_credits?.credits ?? 0}</p>

          <div className="flex gap-2">
            <input className="input-field" type="number" placeholder="ETB amount" value={amount} onChange={e => setAmount(e.target.value)} />
            <button className="btn-primary" onClick={() => adjustBalance('admin_credit')}>Add ETB</button>
            <button className="btn-secondary" onClick={() => adjustBalance('admin_debit')}>Deduct</button>
          </div>

          <div className="flex gap-2">
            <input className="input-field" type="number" placeholder="Credits (+/-)" value={credits} onChange={e => setCredits(e.target.value)} />
            <button className="btn-primary" onClick={adjustCredits}>Adjust Credits</button>
          </div>
        </div>
      )}
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  )
}
