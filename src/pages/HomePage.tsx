import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB, formatCountdown, productImageUrl } from '@/lib/format'
import { Trophy, ChevronRight, Flame } from 'lucide-react'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [balance, setBalance] = useState(0)
  const [auctions, setAuctions] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])

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

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'
  const primaryImg = (p: any) =>
    p?.product_images?.find((i: any) => i.is_primary)?.storage_path ||
    p?.product_images?.[0]?.storage_path

  return (
    <div className="space-y-7">
      {/* Greeting + balance hero */}
      <section>
        <p className="text-sm text-muted-foreground mb-1">
          {t('welcome')}{profile?.display_name ? `, ${profile.display_name}` : ''} 👋
        </p>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 shadow-lg shadow-brand-700/30">
          {/* Decorative ring */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/8" />
          <p className="text-brand-100 text-xs font-medium uppercase tracking-widest relative">{t('balance')}</p>
          <p className="text-white text-3xl font-black relative mt-1 tabular-nums">{formatETB(balance)}</p>
          <Link
            to="/wallet"
            className="mt-4 inline-flex items-center gap-1.5 text-brand-100 hover:text-white text-sm font-medium
                       bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition relative"
          >
            {t('add_balance')} <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* Active auctions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            {t('running')}
          </h2>
          <Link to="/auctions" className="text-sm text-brand-600 dark:text-brand-400 font-medium flex items-center gap-0.5 hover:underline">
            {t('auctions')} <ChevronRight size={14} />
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="card p-8 text-center text-muted-foreground text-sm">No active auctions right now.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {auctions.map(a => {
              const img = primaryImg(a.products)
              return (
                <Link
                  key={a.id}
                  to={`/auctions/${a.id}`}
                  className="card flex gap-3 p-3 hover:border-brand-500/40 transition-all active:scale-[0.99] group"
                >
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {img ? (
                      <img src={productImageUrl(img)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Flame size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="font-semibold text-sm truncate">{title(a.products)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatETB(a.bid_cost)} / bid</p>
                    <p className="countdown text-xs mt-1">{formatCountdown(a.end_time)}</p>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent winners */}
      {winners.length > 0 && (
        <section>
          <h2 className="section-title flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-amber-500" />
            {t('recent_winners')}
          </h2>
          <div className="card divide-y divide-gray-100 dark:divide-white/6 overflow-hidden">
            {winners.map((w, i) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300' :
                      'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400'}`}>
                    {(w.profiles?.display_name || 'W')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{w.profiles?.display_name || 'Winner'}</p>
                    <p className="text-xs text-muted-foreground truncate">{title(w.auctions?.products)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-brand-600 dark:text-brand-400 font-bold text-sm">{formatETB(w.winning_bid)}</p>
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
