import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB } from '@/lib/format'
import { Package } from 'lucide-react'

const statusStyle: Record<string, { cls: string; label: string }> = {
  pending_address: { cls: 'badge-gray',  label: 'Awaiting Address' },
  processing:      { cls: 'badge-teal',  label: 'Processing' },
  shipped:         { cls: 'badge-green', label: 'Shipped' },
  delivered:       { cls: 'badge-green', label: 'Delivered' },
  cancelled:       { cls: 'badge-red',   label: 'Cancelled' },
}

export default function MyOrdersPage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, winners(winning_bid, auctions(products(title_am, title_en)))')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    })()
  }, [profile])

  const pTitle = (o: any) => {
    const p = o.winners?.auctions?.products
    return (i18n.language === 'am' ? p?.title_am : p?.title_en) || 'Product'
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="section-title flex items-center gap-2">
        <Package size={20} className="text-brand-500" />
        {t('my_orders')}
      </h1>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-muted-foreground">No orders yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Win an auction to get your first order!</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-white/6 overflow-hidden">
          {orders.map(o => {
            const st = statusStyle[o.status] || { cls: 'badge-gray', label: o.status }
            return (
              <div key={o.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{pTitle(o)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    {o.winners?.winning_bid && (
                      <p className="text-xs text-muted-foreground mt-1">Won at {formatETB(o.winners.winning_bid)}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
