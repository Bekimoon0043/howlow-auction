import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB, formatCountdown, productImageUrl } from '@/lib/format'
import { Trophy, ChevronRight, Flame, Plus, Zap, Users, Clock } from 'lucide-react'

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [balance, setBalance] = useState(0)
  const [auctions, setAuctions] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const [{ data: w }, { data: a }, { data: win }] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', profile.id).single(),
        supabase
          .from('auctions')
          .select('*, products(title_am, title_en, product_images(storage_path, is_primary))')
          .eq('status', 'active')
          .order('end_time', { ascending: true })
          .limit(6),
        supabase
          .from('winners')
          .select('*, profiles(display_name), auctions(products(title_am, title_en))')
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      if (w) setBalance(w.balance)
      if (a) setAuctions(a)
      if (win) setWinners(win)
    })()
  }, [profile])

  // Live countdown tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'
  const primaryImg = (p: any) =>
    p?.product_images?.find((i: any) => i.is_primary)?.storage_path ||
    p?.product_images?.[0]?.storage_path

  const isUrgent = (end: string) => new Date(end).getTime() - Date.now() < 3600000

  return (
    <div className="space-y-8 pb-4">
      {/* ── Wallet hero ── */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 p-6 shadow-2xl shadow-brand-900/50">
          {/* Decorative blobs */}
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-6 bottom-0 w-32 h-32 rounded-full bg-brand-400/20 blur-xl" />
          <div className="absolute left-0 bottom-0 w-20 h-20 rounded-full bg-white/5" />

          <div className="relative">
            <p className="text-brand-200 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              {t('welcome')}{profile?.display_name ? `, ${profile.display_name}` : ''} 👋
            </p>
            <p className="text-brand-100/70 text-xs mt-2 uppercase tracking-widest font-medium">{t('balance')}</p>
            <p className="text-white text-4xl font-black mt-0.5 tabular-nums tracking-tight">
              {formatETB(balance)}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <Link
                to="/wallet"
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-sm
                           px-4 py-2.5 rounded-2xl hover:bg-brand-50 active:scale-95 transition-all shadow-lg"
              >
                <Plus size={16} />
                {t('add_balance')}
              </Link>
              <Link
                to="/auctions"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm
                           bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-2xl transition-all"
              >
                {t('auctions')} <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live auctions ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg flex items-center gap-2.5">
            <Flame size={20} className="text-orange-500" />
            {t('running')}
            {auctions.length > 0 && <LiveDot />}
          </h2>
          <Link
            to="/auctions"
            className="text-sm text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-0.5
                       hover:gap-1.5 transition-all"
          >
            {t('auctions')} <ChevronRight size={14} />
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
            <Zap size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-muted-foreground text-sm">No active auctions right now.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {auctions.map(a => {
              const img = primaryImg(a.products)
              const urgent = isUrgent(a.end_time)
              return (
                <Link
                  key={a.id}
                  to={`/auctions/${a.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10
                             hover:border-brand-500/50 dark:hover:border-brand-500/40 transition-all duration-300
                             hover:shadow-xl hover:shadow-brand-500/10 active:scale-[0.98] bg-white dark:bg-gray-900/60"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {img ? (
                      <img
                        src={productImageUrl(img)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Flame size={32} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Live badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white
                                       text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                        <LiveDot />
                        LIVE
                      </span>
                    </div>

                    {/* Countdown on image */}
                    <div className="absolute bottom-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1.5 rounded-xl
                                        backdrop-blur-sm border ${urgent
                          ? 'bg-red-500/80 border-red-400/50 text-white animate-pulse'
                          : 'bg-black/60 border-white/20 text-white'
                        }`}>
                        <Clock size={11} />
                        {formatCountdown(a.end_time)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3.5">
                    <p className="font-bold text-sm leading-tight mb-2">{title(a.products)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap size={11} className="text-brand-500" />
                        <span className="font-semibold text-brand-600 dark:text-brand-400">{formatETB(a.bid_cost)}</span>
                        <span>/ bid</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={11} />
                        {a.participant_count ?? 0}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Recent winners ── */}
      {winners.length > 0 && (
        <section>
          <h2 className="font-black text-lg flex items-center gap-2.5 mb-4">
            <Trophy size={20} className="text-amber-500" />
            {t('recent_winners')}
          </h2>
          <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10
                          bg-white dark:bg-gray-900/60 divide-y divide-gray-100 dark:divide-white/6">
            {winners.map((w, i) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50
                                          dark:hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black
                    ${i === 0
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400'
                    }`}>
                    {i === 0 ? '🥇' : (w.profiles?.display_name || 'W')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{w.profiles?.display_name || 'Winner'}</p>
                    <p className="text-xs text-muted-foreground truncate">{title(w.auctions?.products)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-brand-600 dark:text-brand-400 font-black text-sm tabular-nums">
                    {formatETB(w.winning_bid)}
                  </p>
                  <p className="text-xs text-muted-foreground">winning bid</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
