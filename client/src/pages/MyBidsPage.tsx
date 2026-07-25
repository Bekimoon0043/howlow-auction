import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB } from '@/lib/format'

export default function MyBidsPage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [bids, setBids] = useState<any[]>([])

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data } = await supabase
        .from('bids')
        .select('*, auctions(status, end_time, products(title_am, title_en))')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setBids(data || [])
    })()
  }, [profile])

  const title = (p: any) => (i18n.language === 'am' ? p?.title_am : p?.title_en) || '—'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('my_bids')}</h1>
      {bids.map(b => (
        <div key={b.id} className="card p-4 flex justify-between items-center">
          <div>
            <p className="font-medium">{title(b.auctions?.products)}</p>
            <p className="text-xs text-gray-500">{new Date(b.created_at).toLocaleString()}</p>
            <p className="text-xs">Status: {b.auctions?.status}</p>
          </div>
          <p className="font-semibold text-brand-700">{formatETB(b.amount)}</p>
        </div>
      ))}
      {bids.length === 0 && <p className="text-gray-500 text-center py-8">No bids yet.</p>}
    </div>
  )
}
