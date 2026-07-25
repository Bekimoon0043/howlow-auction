import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB } from '@/lib/format'

export default function WalletPage() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [balance, setBalance] = useState(0)
  const [credits, setCredits] = useState(0)
  const [txs, setTxs] = useState<any[]>([])
  const [telegram, setTelegram] = useState('HowLowAdmin')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const [{ data: w }, { data: c }, { data: tlist }, { data: s }] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', profile.id).single(),
        supabase.from('user_bid_credits').select('credits').eq('user_id', profile.id).single(),
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('settings').select('value').eq('key', 'admin_telegram_username').single()
      ])
      if (w) setBalance(w.balance)
      if (c) setCredits(c.credits)
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
    if (error) setMsg(error.message)
    else {
      setMsg('Request submitted. Now contact admin on Telegram.')
      setAmount('')
      setNote('')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('wallet')}</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">{t('balance')}</p>
          <p className="text-2xl font-bold text-brand-700">{formatETB(balance)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">{t('bid_credits')}</p>
          <p className="text-2xl font-bold">{credits}</p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">{t('add_balance')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('deposit_instructions')}</p>
        <a
          href={`https://t.me/${telegram}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary block text-center"
        >
          {t('contact_admin')} (@{telegram})
        </a>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <p className="text-sm font-medium">Optional: Log deposit request</p>
          <input
            type="number"
            className="input-field"
            placeholder="Amount ETB"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <button className="btn-secondary w-full" onClick={submitDepositRequest}>
            Submit Request
          </button>
          {msg && <p className="text-sm text-center">{msg}</p>}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Transaction History</h2>
        <div className="space-y-2">
          {txs.map(tx => (
            <div key={tx.id} className="card p-3 flex justify-between text-sm">
              <div>
                <p className="font-medium">{tx.type}</p>
                <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
              </div>
              <p className={tx.type.includes('credit') || tx.type === 'deposit' ? 'text-green-600' : ''}>
                {tx.amount} {tx.balance_after != null ? 'ETB' : 'credits'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
