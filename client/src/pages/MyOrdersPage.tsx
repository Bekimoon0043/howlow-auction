import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export default function MyOrdersPage() {
  const { t } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, winners(winning_bid, auctions(products(title_am, title_en)))')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
    })()
  }, [profile])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('my_orders')}</h1>
      {orders.map(o => (
        <div key={o.id} className="card p-4">
          <p className="font-medium">{o.winners?.auctions?.products?.title_en || 'Product'}</p>
          <p className="text-sm">Status: {o.status}</p>
          <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
        </div>
      ))}
      {orders.length === 0 && <p className="text-gray-500 text-center py-8">No orders yet.</p>}
    </div>
  )
}
