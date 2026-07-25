import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminSettings() {
  const [telegram, setTelegram] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'admin_telegram_username').single()
      if (data?.value) setTelegram(String(data.value).replace(/"/g, ''))
    })()
  }, [])

  const save = async () => {
    const { error } = await supabase.from('settings').upsert({
      key: 'admin_telegram_username',
      value: JSON.stringify(telegram),
      updated_at: new Date().toISOString()
    })
    setMsg(error ? error.message : 'Saved')
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="card p-4 space-y-3">
        <label className="block text-sm font-medium">Admin Telegram Username</label>
        <input className="input-field" value={telegram} onChange={e => setTelegram(e.target.value.replace('@', ''))} placeholder="username" />
        <p className="text-xs text-gray-500">Users will open t.me/{telegram || '...'}</p>
        <button className="btn-primary" onClick={save}>Save</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
      <div className="card p-4 text-sm text-gray-500">
        <p>Currency is locked to <strong>ETB</strong>.</p>
        <p>Default language is <strong>Amharic</strong>.</p>
      </div>
    </div>
  )
}
