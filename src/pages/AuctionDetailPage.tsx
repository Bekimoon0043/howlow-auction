import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB, formatCountdown, productImageUrl } from '@/lib/format'

export default function AuctionDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const profile = useAuthStore(s => s.profile)
  const [auction, setAuction] = useState<any>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')
  const [loading, setLoading] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

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

  useEffect(() => {
    if (!profile) return
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', profile.id)
      .single()
      .then(({ data }) => { if (data) setBalance(data.balance) })
  }, [profile])

  const placeBid = async () => {
    if (!id || !bidAmount) return
    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= 0) { setMsg('Enter a valid bid amount'); setMsgType('err'); return }
    if (balance !== null && balance < (auction?.bid_cost ?? 0)) {
      setMsg('Insufficient wallet balance. Top up your wallet first.')
      setMsgType('err')
      return
    }
    setLoading(true)
    setMsg('')
    const { data, error } = await supabase.rpc('place_bid', {
      p_auction_id: id,
      p_amount: amount
    })
    setLoading(false)
    if (error) {
      setMsg(error.message)
      setMsgType('err')
    } else if (data?.success) {
      setMsg('Bid placed! ✓')
      setMsgType('ok')
      setBidAmount('')
      if (data.remaining_balance !== undefined) setBalance(data.remaining_balance)
    } else {
      setMsg(JSON.stringify(data))
      setMsgType('err')
    }
  }

  if (!auction) return <p className="text-center py-10">{t('loading')}</p>

  const p = auction.products
  const images: any[] = p?.product_images ?? []
  const title = i18n.language === 'am' ? p?.title_am : p?.title_en
  const desc  = i18n.language === 'am' ? p?.description_am : p?.description_en
  const notEnoughBalance = balance !== null && balance < (auction.bid_cost ?? 0)

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Image gallery */}
      <div className="card overflow-hidden">
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
          {images.length > 0 ? (
            <img
              src={productImageUrl(images[imgIdx]?.storage_path ?? '')}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-1.5 p-2 overflow-x-auto">
            {images.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => setImgIdx(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === imgIdx ? 'border-brand-600' : 'border-transparent'}`}
              >
                <img src={productImageUrl(img.storage_path)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-4 space-y-2">
          <h1 className="text-xl font-bold">{title}</h1>
          {desc && <p className="text-gray-500 text-sm">{desc}</p>}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('retail_price')}</p>
              <p className="font-bold text-brand-700">{formatETB(p?.retail_price)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('bid_cost')} / bid</p>
              <p className="font-bold">{formatETB(auction.bid_cost)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('time_remaining')}</p>
              <p className="font-mono font-bold text-sm">{formatCountdown(auction.end_time)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">{t('participants')}</p>
              <p className="font-bold">{auction.participant_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bidding panel */}
      {auction.status === 'active' && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('place_bid')}</h2>
            {balance !== null && (
              <span className={`text-sm font-medium ${notEnoughBalance ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                {t('balance')}: {formatETB(balance)}
              </span>
            )}
          </div>

          {notEnoughBalance && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl p-3 text-sm">
              Your balance is too low. Each bid costs {formatETB(auction.bid_cost)}. Add balance from the Wallet page.
            </div>
          )}

          <input
            type="number"
            step="0.01"
            min={auction.min_bid}
            max={auction.max_bid ?? undefined}
            className="input-field"
            placeholder={`Min: ${auction.min_bid}${auction.max_bid ? ` — Max: ${auction.max_bid}` : ''}`}
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            disabled={notEnoughBalance}
          />

          <button
            className="btn-primary w-full disabled:opacity-50"
            onClick={placeBid}
            disabled={loading || notEnoughBalance}
          >
            {loading ? t('loading') : `${t('place_bid')} (${formatETB(auction.bid_cost)} will be deducted)`}
          </button>

          {msg && (
            <p className={`text-sm text-center font-medium ${msgType === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
        </div>
      )}

      {auction.status !== 'active' && (
        <div className="card p-4 text-center text-gray-500 text-sm">
          This auction is <strong>{auction.status}</strong>.
        </div>
      )}
    </div>
  )
}
