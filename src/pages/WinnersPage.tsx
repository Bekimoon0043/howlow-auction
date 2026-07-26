import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'
import { Trophy, Medal } from 'lucide-react'

export default function WinnersPage() {
  const { t, i18n } = useTranslation()
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('winners')
        .select('*, profiles(display_name), auctions(products(title_am, title_en))')
        .order('created_at', { ascending: false })
        .limit(50)
      setWinners(data || [])
      setLoading(false)
    })()
  }, [])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="section-title flex items-center gap-2">
        <Trophy size={20} className="text-amber-500" />
        {t('winners')}
      </h1>

      {winners.length === 0 ? (
        <div className="card p-12 text-center">
          <Medal size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-muted-foreground">No winners yet. Be the first!</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-white/6 overflow-hidden">
          {winners.map((w, i) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm
                ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300' :
                  i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300' :
                  i === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-400/20 dark:text-orange-400' :
                  'bg-gray-50 text-gray-400 dark:bg-white/5'}`}>
                {i < 3 ? ['🥇','🥈','🥉'][i] : (w.profiles?.display_name || 'W')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{w.profiles?.display_name || 'Winner'}</p>
                <p className="text-xs text-muted-foreground truncate">{title(w.auctions?.products)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-brand-600 dark:text-brand-400 text-sm">{formatETB(w.winning_bid)}</p>
                <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
