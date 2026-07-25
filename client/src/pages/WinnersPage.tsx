import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'

export default function WinnersPage() {
  const { t, i18n } = useTranslation()
  const [winners, setWinners] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('winners')
        .select('*, profiles(display_name), auctions(products(title_am, title_en, retail_price))')
        .order('created_at', { ascending: false })
        .limit(50)
      setWinners(data || [])
    })()
  }, [])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('winners')}</h1>
      {winners.map(w => (
        <div key={w.id} className="card p-4">
          <div className="flex justify-between">
            <p className="font-medium">{w.profiles?.display_name}</p>
            <p className="text-brand-700 font-bold">{formatETB(w.winning_bid)}</p>
          </div>
          <p className="text-sm text-gray-500">{title(w.auctions?.products)}</p>
          <p className="text-xs mt-1">
            Retail: {formatETB(w.retail_price)} · Savings: {formatETB(w.savings)}
          </p>
        </div>
      ))}
    </div>
  )
}
