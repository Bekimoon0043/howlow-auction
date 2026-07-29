import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB, maskPhone } from '@/lib/format'
import { Check, X, RefreshCw, Search, Wallet as WalletIcon, Bell, Plus, Minus, MessageSquare } from 'lucide-react'

interface DepositRequest {
  id: string
  user_id: string
  amount: number
  note: string | null
  status: 'pending' | 'resolved' | 'rejected'
  created_at: string
  profiles?: { display_name: string; phone_number: string } | null
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminWallet() {
  const [phone, setPhone] = useState('')
  const [user, setUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [note, setNoteText] = useState('')
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [userTxs, setUserTxs] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

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

  useEffect(() => { loadRequests() }, [loadRequests])

  const find = async () => {
    setMsg('')
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, wallets(balance)')
      .eq('phone_number', phone)
      .maybeSingle()
    setSearching(false)
    setUser(data)
    if (!data) {
      setMsg('User not found')
      setMsgOk(false)
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
    if (error) { setMsg(error.message); setMsgOk(false) }
    else {
      setMsg(`Success. New balance: ${formatETB(data?.new_balance ?? 0)}`)
      setMsgOk(true)
      setAmount('')
      setNoteText('')
      find()
    }
  }

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
    if (error) { setMsg(error.message); setMsgOk(false); return }
    setMsg(`Approved ${formatETB(req.amount)} for ${req.profiles?.display_name ?? req.user_id}. New balance: ${formatETB(data?.new_balance ?? 0)}`)
    setMsgOk(true)
    setRequests(prev => prev.filter(r => r.id !== req.id))
  }

  const rejectRequest = async (req: DepositRequest) => {
    setBusyId(req.id)
    setMsg('')
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('deposit_requests')
      .update({ status: 'rejected', resolved_by: authUser?.id, resolved_at: new Date().toISOString() })
      .eq('id', req.id)
      .eq('status', 'pending')
    setBusyId(null)
    if (error) { setMsg(error.message); setMsgOk(false); return }
    setMsg(`Rejected deposit request for ${req.profiles?.display_name ?? req.user_id}`)
    setMsgOk(true)
    setRequests(prev => prev.filter(r => r.id !== req.id))
  }

  const inspectRequester = (req: DepositRequest) => {
    if (req.profiles?.phone_number) {
      setPhone(req.profiles.phone_number)
      setTimeout(find, 0)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <WalletIcon className="text-brand-400" size={22} />
            Wallet Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Approve deposits and adjust balances</p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10
                     text-gray-300 text-sm font-medium px-3.5 py-2 rounded-xl transition-all"
          onClick={loadRequests}
        >
          <RefreshCw size={14} className={loadingRequests ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {msg && (
        <div className={`rounded-2xl p-3.5 text-sm font-medium border ${
          msgOk ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300'
                : 'bg-red-400/10 border-red-400/30 text-red-300'
        }`}>
          {msg}
        </div>
      )}

      {/* ── Pending deposit requests ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell size={15} className="text-amber-400" />
            Pending Deposit Requests
            {requests.length > 0 && (
              <span className="text-xs bg-amber-400 text-black rounded-full px-2 py-0.5 font-black animate-pulse">
                {requests.length}
              </span>
            )}
          </h2>
          {requests.length > 0 && (
            <span className="text-xs text-gray-500">{requests.length} awaiting action</span>
          )}
        </div>

        {loadingRequests && requests.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-brand-500 rounded-full animate-spin" />
            Loading requests…
          </div>
        )}

        {!loadingRequests && requests.length === 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
            <Check className="mx-auto text-emerald-400 mb-2" size={28} />
            <p className="text-sm text-gray-400 font-medium">All caught up — no pending requests.</p>
          </div>
        )}

        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-gradient-to-br from-white/6 to-white/3 border border-white/12 rounded-2xl overflow-hidden
                         shadow-lg shadow-black/20"
            >
              {/* Top row — user info + amount */}
              <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar initial */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center
                                  justify-center text-white font-black text-base flex-shrink-0">
                    {(req.profiles?.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">
                      {req.profiles?.display_name || 'Unknown user'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {req.profiles?.phone_number ? maskPhone(req.profiles.phone_number) : req.user_id.slice(0, 12) + '…'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-brand-400 tabular-nums">{formatETB(req.amount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(req.created_at)}</p>
                </div>
              </div>

              {/* Message from user */}
              {req.note ? (
                <div className="mx-4 mb-3 flex items-start gap-2.5 bg-amber-400/8 border border-amber-400/20 rounded-xl px-3.5 py-2.5">
                  <MessageSquare size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider mb-0.5">
                      Message from user
                    </p>
                    <p className="text-sm text-amber-100 leading-relaxed">
                      {req.note}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-gray-600 italic px-1">
                  <MessageSquare size={12} />
                  No message provided
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 px-4 pb-4">
                <button
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-gray-300 transition-all flex items-center gap-1.5"
                  onClick={() => inspectRequester(req)}
                >
                  <Search size={12} />
                  Inspect
                </button>
                <button
                  className="flex-1 text-sm font-bold py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500
                             hover:from-brand-500 hover:to-brand-400 text-white transition-all disabled:opacity-50
                             flex items-center justify-center gap-2 shadow-lg shadow-brand-700/20"
                  disabled={busyId === req.id}
                  onClick={() => approveRequest(req)}
                >
                  <Check size={15} />
                  {busyId === req.id ? 'Processing…' : `Approve ${formatETB(req.amount)}`}
                </button>
                <button
                  className="text-sm font-bold px-4 py-2 rounded-xl border border-red-400/30 text-red-400
                             hover:bg-red-400/10 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  disabled={busyId === req.id}
                  onClick={() => rejectRequest(req)}
                >
                  <X size={15} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Manual balance adjustment ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Manual Balance Adjustment</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                       placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
            placeholder="+2519xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && find()}
          />
          <button
            className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400
                       text-white font-semibold text-sm px-5 rounded-xl transition-all disabled:opacity-50"
            onClick={find} disabled={searching}
          >
            {searching ? 'Searching…' : 'Find'}
          </button>
        </div>

        {user && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white text-sm">{user.display_name} · {user.phone_number}</p>
              {user.is_banned && <span className="text-xs text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded-full">BANNED</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500">Wallet Balance</p>
              <p className="text-2xl font-black text-white tabular-nums">{formatETB(user.wallets?.balance ?? 0)}</p>
            </div>

            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                         placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
              placeholder="Note (optional, e.g. Telegram receipt #1234)"
              value={note} onChange={e => setNoteText(e.target.value)}
            />

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                           placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
                type="number" placeholder="ETB amount" value={amount} onChange={e => setAmount(e.target.value)}
              />
              <button
                className="inline-flex items-center gap-1 whitespace-nowrap bg-gradient-to-r from-brand-600 to-brand-500
                           hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm px-4 rounded-xl transition-all"
                onClick={() => adjustBalance('admin_credit')}
              >
                <Plus size={14} /> Add
              </button>
              <button
                className="inline-flex items-center gap-1 whitespace-nowrap bg-white/8 hover:bg-white/15 border border-white/10
                           text-gray-200 font-semibold text-sm px-4 rounded-xl transition-all"
                onClick={() => adjustBalance('admin_debit')}
              >
                <Minus size={14} /> Deduct
              </button>
            </div>

            {userTxs.length > 0 && (
              <div className="pt-3 border-t border-white/8">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Transactions</p>
                <div className="space-y-1.5">
                  {userTxs.map(tx => (
                    <div key={tx.id} className="flex justify-between text-xs text-gray-400">
                      <span>{tx.type} · {new Date(tx.created_at).toLocaleString()}</span>
                      <span className="text-gray-200 font-medium tabular-nums">{formatETB(tx.amount)}</span>
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
