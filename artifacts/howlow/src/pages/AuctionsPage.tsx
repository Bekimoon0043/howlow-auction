import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { formatETB, formatCountdown, productImageUrl } from '@/lib/format'
import { Clock, Users, Zap, Flame } from 'lucide-react'

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

export default function AuctionsPage() {
  const { t, i18n } = useTranslation()
  const [auctions, setAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

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

  // Live countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'
  const primaryImg = (p: any) =>
    p?.product_images?.find((i: any) => i.is_primary)?.storage_path ||
    p?.product_images?.[0]?.storage_path

  const isUrgent = (end: string) => new Date(end).getTime() - Date.now() < 3600000

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{t('loading')}</p>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="font-black text-2xl">{t('auctions')}</h1>
        {auctions.length > 0 && (
          <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700
                           dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <LiveDot />
            {auctions.filter(a => a.status === 'active').length} live
          </span>
        )}
      </div>

      {auctions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-muted-foreground font-medium">No auctions available right now.</p>
          <p className="text-sm text-muted-foreground mt-1 opacity-70">Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {auctions.map(a => {
            const img = primaryImg(a.products)
            const isActive = a.status === 'active'
            const urgent = isActive && isUrgent(a.end_time)

            return (
              <div
                key={a.id}
                className={`group relative overflow-hidden rounded-3xl border transition-all duration-300
                  bg-white dark:bg-gray-900/60 hover:shadow-2xl active:scale-[0.98]
                  ${urgent
                    ? 'border-red-400/40 hover:border-red-400/60 hover:shadow-red-500/10'
                    : 'border-gray-100 dark:border-white/10 hover:border-brand-500/40 hover:shadow-brand-500/10'
                  }`}
              >
                {/* Full image with overlay */}
                <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {img ? (
                    <img
                      src={productImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap size={40} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}

                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-sm
                                       border border-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        <LiveDot />
                        LIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-800/70 backdrop-blur-sm
                                       border border-white/10 text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">
                        Scheduled
                      </span>
                    )}
                  </div>

                  {/* Urgent fire badge */}
                  {urgent && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-black
                                       px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/40">
                        <Flame size={10} />
                        Ending soon!
                      </span>
                    </div>
                  )}

                  {/* Bottom overlay content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-black text-white text-base leading-tight mb-2 drop-shadow-lg">
                      {title(a.products)}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-white/80 font-semibold">
                          <Zap size={11} className="text-brand-300" />
                          {formatETB(a.bid_cost)}
                        </span>
                        <span className="flex items-center gap-1 text-white/70">
                          <Users size={11} />
                          {a.participant_count ?? 0}
                        </span>
                      </div>
                      {isActive && (
                        <span className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-xl
                          ${urgent
                            ? 'bg-red-500/80 text-white border border-red-400/50'
                            : 'bg-black/50 text-white/90 border border-white/20'
                          } backdrop-blur-sm`}>
                          <Clock size={10} />
                          {formatCountdown(a.end_time)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-3">
                  <Link
                    to={`/auctions/${a.id}`}
                    className="btn-primary w-full text-sm py-3 rounded-2xl justify-center"
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
