import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { MessageCircle, HelpCircle, Zap, Trophy, Wallet } from 'lucide-react'

export default function HelpPage() {
  const { t } = useTranslation()
  const [telegram, setTelegram] = useState('HowLowAdmin')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'admin_telegram_username').single()
      if (data?.value) setTelegram(String(data.value).replace(/"/g, ''))
    })()
  }, [])

  const faqs = [
    {
      icon: Zap,
      q: 'How does HowLow work?',
      a: 'Each auction runs until a deadline. You place a bid with an amount. The winner is whoever placed the LOWEST bid that no one else placed — the lowest unique bid wins the product.',
    },
    {
      icon: Wallet,
      q: 'How do I add balance?',
      a: 'Contact the admin on Telegram, send your payment, and the admin will credit your wallet. You can also submit a deposit request from the Wallet page so the admin can track it.',
    },
    {
      icon: Trophy,
      q: 'What happens if I win?',
      a: 'Congratulations! You will receive a notification and an order will be created. Contact the admin on Telegram to arrange delivery.',
    },
    {
      icon: HelpCircle,
      q: 'Each bid costs ETB from my wallet?',
      a: 'Yes — placing each bid deducts the bid cost from your wallet balance. Make sure you have enough balance before bidding.',
    },
  ]

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="section-title flex items-center gap-2">
        <HelpCircle size={20} className="text-brand-500" />
        {t('help')}
      </h1>

      {/* Contact card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 shadow-lg shadow-brand-700/25">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
        <MessageCircle size={28} className="text-brand-200 mb-3 relative" />
        <p className="text-white font-bold text-base relative mb-1">{t('contact_admin')}</p>
        <p className="text-brand-100 text-sm relative mb-4">{t('deposit_instructions')}</p>
        <a
          href={`https://t.me/${telegram}`}
          target="_blank"
          rel="noreferrer"
          className="relative inline-flex items-center gap-2 bg-white text-brand-700 font-semibold
                     px-4 py-2.5 rounded-xl text-sm hover:bg-brand-50 transition active:scale-95"
        >
          <MessageCircle size={16} />
          @{telegram} on Telegram
        </a>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="font-bold text-base">Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <faq.icon size={15} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-2">
        For password reset, contact the admin on Telegram with your phone number.
      </p>
    </div>
  )
}
