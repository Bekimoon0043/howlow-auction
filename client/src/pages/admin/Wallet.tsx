import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB, maskPhone } from '@/lib/format'
import { Check, X, RefreshCw, Search } from 'lucide-react'

interface DepositRequest {
  id: string
  user_id: string
  amount: number
  note: string | null
  status: 'pending' | 'resolved' | 'rejected'
  created_at: string
  profiles?: { display_name: string; phone_number: string } | null
}

export default function AdminWallet() {
  // --- manual find / adjust ---
  const [phone, setPhone] = useState('')
  const [user, setUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [credits, setCredits] = useState('')
  const [note, setNoteText] = useState('')
  const [msg, setMsg] = useState('')
  const [userTxs, setUserTxs] = useState<any[]>([])

  // --- pending deposit requests queue ---
  const [requests, setRequests] = useState<DepositRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true)
    const { data, error } = await supabase
      .from('deposit_requests')
      .select('*, profiles(display_name, phone_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (!error) setRequests(data || [])
    setLoadingRequests(false)
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const find = async () => {
    setMsg('')
    const { data } = await supabase
      .from('profiles')
      .select('*, wallets(balance), user_bid_credits(credits)')
      .eq('phone_number', phone)
      .maybeSingle()
    setUser(data)
    if (!data) {
      setMsg('User not found')
      setUserTxs([])
      return
    }
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', data.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setUserTxs(txs || [])
  }

  const adjustBalance = async (type: 'admin_credit' | 'admin_debit') => {
    if (!user || !amount) return
    const { data, error } = await supabase.rpc('admin_adjust_wallet', {
      p_target_user: user.id,
      p_amount: parseFloat(amount),
      p_type: type,
      p_note: note || 'Manual admin adjustment'
    })
    if (error) setMsg(error.message)
    else {
      setMsg(`Success. New balance: ${formatETB(data?.new_balance ?? 0)}`)
      setAmount('')
      setNoteText('')
      find()
    }
  }

  const adjustCredits = async () => {
    if (!user || !credits) return
    const { data, error } = await supabase.rpc('admin_adjust_credits', {
      p_target_user: user.id,
      p_credits: parseInt(credits),
      p_note: note || 'Manual credit adjustment'
    })
    if (error) setMsg(error.message)
    else {
      setMsg(`Success. New credits: ${data?.new_credits}`)
      setCredits('')
      setNoteText('')
      find()
    }
  }

  // Approve a pending deposit request: credits the user's wallet with the
  // exact requested amount and marks the request resolved in one atomic RPC call.
  const approveRequest = async (req: DepositRequest) => {
    setBusyId(req.id)
    setMsg('')
    const { data, error } = await supabase.rpc('admin_adjust_wallet', {
      p_target_user: req.user_id,
      p_amount: req.amount,
      p_type: 'admin_credit',
      p_note: `Deposit approved${req.note ? ` — ${req.note}` : ''}`,
      p_deposit_request_id: req.id
    })
    setBusyId(null)
    if (error) {
      setMsg(error.message)
      return
    }
    setMsg(`Approved ${formatETB(req.amount)} for ${req.profiles?.display_name ?? req.user_id}. New balance: ${formatETB(data?.new_balance ?? 0)}`)
    setRequests(prev => prev.filter(r => r.id !== req.id))
  }

  const rejectRequest = async (req: DepositRequest) => {
    setBusyId(req.id)
    setMsg('')
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('deposit_requests')
      .update({ status: 'rejected', resolved_by: authUser?.id, resolved_at: new Date().toISOString() })
      .eq('id', req.id)
      .eq('status', 'pending')
    setBusyId(null)
    if (error) {
      setMsg(error.message)
      return
    }
    setMsg(`Rejected deposit request for ${req.profiles?.display_name ?? req.user_id}`)
    setRequests(prev => prev.filter(r => r.id !== req.id))
  }

  // Quick-fill the manual lookup with a requester's phone so the admin can
  // review their full wallet/credit history before approving.
  const inspectRequester = (req: DepositRequest) => {
    if (req.profiles?.phone_number) {
      setPhone(req.profiles.phone_number)
      setTimeout(find, 0)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        <button className="btn-secondary flex items-center gap-2 text-sm" onClick={loadRequests}>
          <RefreshCw size={14} className={loadingRequests ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {msg && (
        <div className="card p-3 text-sm border-l-4 border-brand-600">{msg}</div>
      )}

      {/* Pending deposit / payment requests */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Pending Deposit Requests
          {requests.length > 0 && (
            <span className="text-xs bg-brand-700 text-white rounded-full px-2 py-0.5">{requests.length}</span>
          )}
        </h2>

        {loadingRequests && requests.length === 0 && <p className="text-sm text-gray-500">Loading…</p>}
        {!loadingRequests && requests.length === 0 && (
          <p className="text-sm text-gray-500">No pending deposit requests. You're all caught up.</p>
        )}

        <div className="space-y-2">
          {requests.map(req => (
            <div key={req.id} className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">
                  {req.profiles?.display_name || 'Unknown user'} ·{' '}
                  <span className="text-gray-500">{req.profiles?.phone_number ? maskPhone(req.profiles.phone_number) : req.user_id}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Requested {formatETB(req.amount)} · {new Date(req.created_at).toLocaleString()}
                </p>
                {req.note && <p className="text-sm italic text-gray-500">"{req.note}"</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-sm" onClick={() => inspectRequester(req)}>
                  <Search size={14} className="inline mr-1" />
                  Inspect
                </button>
                <button
                  className="btn-primary text-sm flex items-center gap-1"
                  disabled={busyId === req.id}
                  onClick={() => approveRequest(req)}
                >
                  <Check size={14} />
                  Approve &amp; Credit
                </button>
                <button
                  className="text-sm flex items-center gap-1 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  disabled={busyId === req.id}
                  onClick={() => rejectRequest(req)}
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manual lookup + balance / credit adjustment */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Manual Balance &amp; Credit Adjustment</h2>
        <div className="flex gap-2">
          <input className="input-field" placeholder="+2519xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} />
          <button className="btn-primary" onClick={find}>Find</button>
        </div>

        {user && (
          <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{user.display_name} · {user.phone_number}</p>
              {user.is_banned && <span className="text-xs text-red-600 font-semibold">BANNED</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-xl font-bold text-brand-700">{formatETB(user.wallets?.balance ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bid Credits</p>
                <p className="text-xl font-bold">{user.user_bid_credits?.credits ?? 0}</p>
              </div>
            </div>

            <input
              className="input-field"
              placeholder="Note (optional, e.g. Telegram receipt #1234)"
              value={note}
              onChange={e => setNoteText(e.target.value)}
            />

            <div className="flex gap-2">
              <input className="input-field" type="number" placeholder="ETB amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <button className="btn-primary whitespace-nowrap" onClick={() => adjustBalance('admin_credit')}>Add Balance</button>
              <button className="btn-secondary whitespace-nowrap" onClick={() => adjustBalance('admin_debit')}>Deduct</button>
            </div>

            <div className="flex gap-2">
              <input className="input-field" type="number" placeholder="Credits (+/-)" value={credits} onChange={e => setCredits(e.target.value)} />
              <button className="btn-primary whitespace-nowrap" onClick={adjustCredits}>Adjust Credits</button>
            </div>

            {userTxs.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium mb-2">Recent Transactions</p>
                <div className="space-y-1">
                  {userTxs.map(tx => (
                    <div key={tx.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{tx.type} · {new Date(tx.created_at).toLocaleString()}</span>
                      <span>{tx.amount} {tx.balance_after != null ? 'ETB' : 'credits'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
