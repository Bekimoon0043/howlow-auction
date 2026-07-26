import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB } from '@/lib/format'
import { MessageCircle, ArrowUpRight, ArrowDownLeft, Send } from 'lucide-react'

const TX_CREDIT = ['deposit', 'admin_credit', 'refund', 'referral_bonus']

const txIcon = (type: string) =>
  TX_CREDIT.includes(type)
    ? <ArrowDownLeft size={14} className="text-emerald-500" />
    : <ArrowUpRight size={14} className="text-red-400" />

export default function WalletPage() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [balance, setBalance] = useState(0)
  const [txs, setTxs] = useState<any[]>([])
  const [telegram, setTelegram] = useState('HowLowAdmin')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const [{ data: w }, { data: tlist }, { data: s }] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', profile.id).single(),
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('settings').select('value').eq('key', 'admin_telegram_username').single(),
      ])
      if (w) setBalance(w.balance)
      if (tlist) setTxs(tlist)
      if (s?.value) setTelegram(String(s.value).replace(/"/g, ''))
    })()
  }, [profile])

  const submitDepositRequest = async () => {
    if (!profile || !amount) return
    const { error } = await supabase.from('deposit_requests').insert({
      user_id: profile.id,
      amount: parseFloat(amount),
      note: note || null
    })
    if (error) { setMsg(error.message); setMsgOk(false) }
    else { setMsg('Request submitted! Contact admin on Telegram.'); setMsgOk(true); setAmount(''); setNote('') }
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-5 shadow-lg shadow-brand-700/25">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/8" />
        <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest relative">{t('balance')}</p>
        <p className="text-white text-4xl font-black relative mt-1 tabular-nums">{formatETB(balance)}</p>
      </div>

      {/* Add balance */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-base">{t('add_balance')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('deposit_instructions')}</p>

        <a
          href={`https://t.me/${telegram}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary w-full"
        >
          <MessageCircle size={16} />
          {t('contact_admin')} · @{telegram}
        </a>

        <div className="pt-1 border-t border-gray-100 dark:border-white/8 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Log deposit request (optional)</p>
          <input type="number" className="input-field" placeholder="Amount in ETB"
            value={amount} onChange={e => setAmount(e.target.value)} />
          <input className="input-field" placeholder="Note (e.g. CBE receipt number)"
            value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn-secondary w-full" onClick={submitDepositRequest}
            disabled={!amount}>
            <Send size={15} />
            Submit Request
          </button>
          {msg && (
            <p className={`text-sm text-center font-medium ${msgOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {msg}
            </p>
          )}
        </div>
      </div>

      {/* Transaction history */}
      {txs.length > 0 && (
        <div>
          <h2 className="font-bold text-base mb-3">Transaction History</h2>
          <div className="card divide-y divide-gray-100 dark:divide-white/6 overflow-hidden">
            {txs.map(tx => {
              const isCredit = TX_CREDIT.includes(tx.type)
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isCredit ? 'bg-emerald-100 dark:bg-emerald-400/15' : 'bg-red-100 dark:bg-red-400/15'}`}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                    {tx.note && <p className="text-xs text-muted-foreground truncate italic">{tx.note}</p>}
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {isCredit ? '+' : '-'}{formatETB(tx.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
