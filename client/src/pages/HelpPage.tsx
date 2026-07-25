import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function HelpPage() {
  const { t } = useTranslation()
  const [telegram, setTelegram] = useState('HowLowAdmin')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'admin_telegram_username').single()
      if (data?.value) setTelegram(String(data.value).replace(/"/g, ''))
    })()
  }, [])

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-semibold">{t('help')}</h1>
      <div className="card p-4 space-y-3 text-sm">
        <p>{t('deposit_instructions')}</p>
        <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="btn-primary block text-center">
          {t('contact_admin')} (@{telegram})
        </a>
        <p className="text-gray-500">
          For password reset, contact the admin on Telegram with your phone number.
        </p>
      </div>
    </div>
  )
}
