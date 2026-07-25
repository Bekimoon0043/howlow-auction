import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { formatETB, formatCountdown } from '@/lib/format'

export default function AuctionDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const [auction, setAuction] = useState<any>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data } = await supabase
        .from('auctions')
        .select('*, products(*, product_images(*))')
        .eq('id', id)
        .single()
      setAuction(data)
    })()
  }, [id])

  const placeBid = async () => {
    if (!id || !bidAmount) return
    setLoading(true)
    setMsg('')
    const { data, error } = await supabase.rpc('place_bid', {
      p_auction_id: id,
      p_amount: parseFloat(bidAmount)
    })
    setLoading(false)
    if (error) setMsg(error.message)
    else if (data?.success) {
      setMsg('Bid placed successfully')
      setBidAmount('')
    } else setMsg(JSON.stringify(data))
  }

  if (!auction) return <p className="text-center py-10">{t('loading')}</p>

  const p = auction.products
  const title = i18n.language === 'am' ? p?.title_am : p?.title_en
  const desc = i18n.language === 'am' ? p?.description_am : p?.description_en

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="card overflow-hidden">
        <div className="aspect-square bg-gray-100 dark:bg-gray-700">
          {p?.product_images?.[0]?.storage_path && (
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${p.product_images[0].storage_path}`}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4 space-y-2">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-gray-500 text-sm">{desc}</p>
          <p className="text-lg">{t('retail_price')}: <strong>{formatETB(p?.retail_price)}</strong></p>
          <p>{t('time_remaining')}: <span className="text-brand-700 font-mono">{formatCountdown(auction.end_time)}</span></p>
          <p>{t('bid_cost')}: {auction.bid_cost} {t('bid_credits')}</p>
          <p>{t('participants')}: {auction.participant_count}</p>
        </div>
      </div>

      {auction.status === 'active' && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold">{t('place_bid')}</h2>
          <input
            type="number"
            step="0.01"
            min={auction.min_bid}
            className="input-field"
            placeholder="0.00"
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
          />
          <button className="btn-primary w-full" onClick={placeBid} disabled={loading}>
            {loading ? t('loading') : t('place_bid')}
          </button>
          {msg && <p className="text-sm text-center">{msg}</p>}
        </div>
      )}
    </div>
  )
}
