import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings as SettingsIcon, Send, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export default function AdminSettings() {
  const [telegram, setTelegram] = useState('')
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'admin_telegram_username').single()
      if (data?.value) setTelegram(String(data.value).replace(/"/g, ''))
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({
      key: 'admin_telegram_username',
      value: JSON.stringify(telegram),
      updated_at: new Date().toISOString()
    })
    setSaving(false)
    setMsg(error ? error.message : 'Saved ✓')
    setMsgOk(!error)
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <SettingsIcon className="text-brand-400" size={22} />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform-wide configuration</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <label className="text-sm font-bold text-white flex items-center gap-1.5">
          <Send size={14} className="text-brand-400" />
          Admin Telegram Username
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-8 pr-3.5 py-3 text-sm text-gray-100
                       placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
            value={telegram}
            onChange={e => setTelegram(e.target.value.replace('@', ''))}
            placeholder="username"
          />
        </div>
        <p className="text-xs text-gray-500">
          Users will be sent to <span className="text-brand-400 font-medium">t.me/{telegram || '…'}</span> to request a deposit.
        </p>
        <button
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500
                     hover:from-brand-500 hover:to-brand-400 active:scale-[0.98] text-white font-semibold text-sm
                     py-3 rounded-xl transition-all shadow-lg shadow-brand-700/25 disabled:opacity-50"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && (
          <p className={`text-sm font-medium flex items-center gap-1.5 ${msgOk ? 'text-emerald-400' : 'text-red-400'}`}>
            {msgOk ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {msg}
          </p>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-gray-400 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <Info size={12} /> Platform Defaults
        </p>
        <p>Currency is locked to <strong className="text-gray-200">ETB</strong>.</p>
        <p>Default language is <strong className="text-gray-200">Amharic</strong>.</p>
        <p>Bids are deducted directly from each user's wallet balance.</p>
      </div>
    </div>
  )
}
