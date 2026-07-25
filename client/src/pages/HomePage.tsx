import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB, formatCountdown } from '@/lib/format'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [balance, setBalance] = useState(0)
  const [credits, setCredits] = useState(0)
  const [auctions, setAuctions] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const [{ data: w }, { data: c }, { data: a }, { data: win }] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', profile.id).single(),
        supabase.from('user_bid_credits').select('credits').eq('user_id', profile.id).single(),
        supabase
          .from('auctions')
          .select('*, products(title_am, title_en, retail_price, product_images(storage_path))')
          .eq('status', 'active')
          .order('end_time', { ascending: true })
          .limit(6),
        supabase
          .from('winners')
          .select('*, profiles(display_name), auctions(products(title_am, title_en))')
          .order('created_at', { ascending: false })
          .limit(5)
      ])
      if (w) setBalance(w.balance)
      if (c) setCredits(c.credits)
      if (a) setAuctions(a)
      if (win) setWinners(win)
    })()
  }, [profile])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold">
          {t('welcome')}{profile?.display_name ? `, ${profile.display_name}` : ''}
        </h1>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-500">{t('balance')}</p>
            <p className="text-lg font-bold text-brand-700">{formatETB(balance)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">{t('bid_credits')}</p>
            <p className="text-lg font-bold">{credits}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">{t('running')}</h2>
          <Link to="/auctions" className="text-sm text-brand-700">{t('auctions')} →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {auctions.map(a => (
            <Link key={a.id} to={`/auctions/${a.id}`} className="card p-3 flex gap-3 hover:shadow-md transition">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                {a.products?.product_images?.[0]?.storage_path && (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${a.products.product_images[0].storage_path}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{title(a.products)}</p>
                <p className="text-sm text-gray-500">{formatETB(a.products?.retail_price)}</p>
                <p className="text-xs text-brand-700 mt-1">{formatCountdown(a.end_time)}</p>
              </div>
            </Link>
          ))}
          {auctions.length === 0 && (
            <p className="text-gray-500 text-sm col-span-2">No active auctions yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">{t('recent_winners')}</h2>
        <div className="space-y-2">
          {winners.map(w => (
            <div key={w.id} className="card p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{w.profiles?.display_name || 'Winner'}</p>
                <p className="text-xs text-gray-500">{title(w.auctions?.products)}</p>
              </div>
              <p className="text-brand-700 font-semibold">{formatETB(w.winning_bid)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
