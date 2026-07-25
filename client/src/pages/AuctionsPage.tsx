import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { formatETB, formatCountdown } from '@/lib/format'

export default function AuctionsPage() {
  const { t, i18n } = useTranslation()
  const [auctions, setAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('auctions')
        .select('*, products(title_am, title_en, retail_price, product_images(storage_path))')
        .in('status', ['active', 'scheduled'])
        .order('end_time', { ascending: true })
      setAuctions(data || [])
      setLoading(false)
    })()
  }, [])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'

  if (loading) return <p className="text-center py-10">{t('loading')}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('auctions')}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {auctions.map(a => (
          <div key={a.id} className="card overflow-hidden">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
              {a.products?.product_images?.[0]?.storage_path && (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${a.products.product_images[0].storage_path}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold">{title(a.products)}</h3>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('retail_price')}: {formatETB(a.products?.retail_price)}</span>
                <span>{t('bid_cost')}: {a.bid_cost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('participants')}: {a.participant_count}</span>
                <span className="text-brand-700 font-medium">{formatCountdown(a.end_time)}</span>
              </div>
              <Link to={`/auctions/${a.id}`} className="btn-primary block text-center mt-2">
                {t('place_bid')}
              </Link>
            </div>
          </div>
        ))}
      </div>
      {auctions.length === 0 && <p className="text-gray-500 text-center py-8">No auctions available.</p>}
    </div>
  )
}
