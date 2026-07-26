import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { formatETB, formatCountdown, productImageUrl } from '@/lib/format'
import { Clock, Users, Zap } from 'lucide-react'

export default function AuctionsPage() {
  const { t, i18n } = useTranslation()
  const [auctions, setAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('auctions')
        .select('*, products(title_am, title_en, product_images(storage_path, is_primary))')
        .in('status', ['active', 'scheduled'])
        .order('end_time', { ascending: true })
      setAuctions(data || [])
      setLoading(false)
    })()
  }, [])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'
  const primaryImg = (p: any) =>
    p?.product_images?.find((i: any) => i.is_primary)?.storage_path ||
    p?.product_images?.[0]?.storage_path

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="section-title">{t('auctions')}</h1>

      {auctions.length === 0 ? (
        <div className="card p-12 text-center">
          <Zap size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-muted-foreground">No auctions available right now.</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {auctions.map(a => {
            const img = primaryImg(a.products)
            const isActive = a.status === 'active'
            return (
              <div key={a.id} className="card overflow-hidden group hover:border-brand-500/40 transition-all">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {img ? (
                    <img
                      src={productImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap size={40} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`badge ${isActive ? 'badge-green' : 'badge-gray'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                      {isActive ? t('running') : 'Scheduled'}
                    </span>
                  </div>
                  {/* Countdown overlay */}
                  {isActive && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-1.5">
                      <p className="countdown text-sm text-white">{formatCountdown(a.end_time)}</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1 leading-tight">{title(a.products)}</h3>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Zap size={13} className="text-brand-500" />
                      {formatETB(a.bid_cost)} / bid
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={13} />
                      {a.participant_count} {t('participants')}
                    </span>
                  </div>

                  <Link
                    to={`/auctions/${a.id}`}
                    className="btn-primary w-full text-sm py-2.5"
                  >
                    {t('place_bid')}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
