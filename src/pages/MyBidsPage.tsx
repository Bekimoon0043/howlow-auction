import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB } from '@/lib/format'
import { Gavel } from 'lucide-react'

const statusStyle: Record<string, string> = {
  active:    'badge-green',
  ended:     'badge-gray',
  no_winner: 'badge-red',
  cancelled: 'badge-red',
  scheduled: 'badge-teal',
}

export default function MyBidsPage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data } = await supabase
        .from('bids')
        .select('*, auctions(status, end_time, products(title_am, title_en))')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setBids(data || [])
      setLoading(false)
    })()
  }, [profile])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="section-title flex items-center gap-2">
        <Gavel size={20} className="text-brand-500" />
        {t('my_bids')}
      </h1>

      {bids.length === 0 ? (
        <div className="card p-12 text-center">
          <Gavel size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-muted-foreground">You haven't placed any bids yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-white/6 overflow-hidden">
          {bids.map(b => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{title(b.auctions?.products)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(b.created_at).toLocaleString()}
                </p>
                {b.auctions?.status && (
                  <span className={`badge mt-1 ${statusStyle[b.auctions.status] || 'badge-gray'}`}>
                    {b.auctions.status}
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-brand-600 dark:text-brand-400">{formatETB(b.amount)}</p>
                <p className="text-xs text-muted-foreground">your bid</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
