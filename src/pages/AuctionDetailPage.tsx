import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatETB, formatCountdown, productImageUrl } from '@/lib/format'
import { ChevronLeft, Zap, Users, Clock, CheckCircle2, AlertCircle, Wallet } from 'lucide-react'

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

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
  const [tick, setTick] = useState(0)
  const [justBid, setJustBid] = useState(false)

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

  // Live countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

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
      setMsg('Bid placed successfully!')
      setMsgType('ok')
      setJustBid(true)
      setBidAmount('')
      if (data.remaining_balance !== undefined) setBalance(data.remaining_balance)
      setTimeout(() => setJustBid(false), 3000)
    } else {
      setMsg(JSON.stringify(data))
      setMsgType('err')
    }
  }

  if (!auction) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{t('loading')}</p>
    </div>
  )

  const p = auction.products
  const images: any[] = p?.product_images ?? []
  const titleText = i18n.language === 'am' ? p?.title_am : p?.title_en
  const desc  = i18n.language === 'am' ? p?.description_am : p?.description_en
  const notEnoughBalance = balance !== null && balance < (auction.bid_cost ?? 0)
  const isActive = auction.status === 'active'
  const isUrgent = isActive && new Date(auction.end_time).getTime() - Date.now() < 3600000

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      {/* Back button */}
      <Link to="/auctions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                                      hover:text-foreground transition-colors font-medium">
        <ChevronLeft size={16} />
        {t('auctions')}
      </Link>

      {/* Image gallery */}
      <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10
                      bg-white dark:bg-gray-900/60 shadow-xl">
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
          {images.length > 0 ? (
            <img
              src={productImageUrl(images[imgIdx]?.storage_path ?? '')}
              alt={titleText}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Status + countdown overlay */}
          {isActive && (
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm
                               border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <LiveDot />
                LIVE
              </span>
              <span className={`inline-flex items-center gap-1.5 font-black text-sm px-3 py-1.5 rounded-2xl
                backdrop-blur-sm border ${isUrgent
                  ? 'bg-red-500/80 border-red-400/50 text-white animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-black/60 border-white/20 text-white'
                }`}>
                <Clock size={13} />
                {formatCountdown(auction.end_time)}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1.5 p-2.5 overflow-x-auto bg-gray-50 dark:bg-black/20">
            {images.map((img: any, i: number) => (
              <button
                key={img.id}
                onClick={() => setImgIdx(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === imgIdx
                    ? 'border-brand-500 shadow-lg shadow-brand-500/30 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={productImageUrl(img.storage_path)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Product info */}
        <div className="p-5 space-y-4">
          <div>
            <h1 className="text-xl font-black leading-tight">{titleText}</h1>
            {desc && <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">{desc}</p>}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3.5 text-center">
              <div className="flex justify-center mb-1">
                <Zap size={16} className="text-brand-500" />
              </div>
              <p className="font-black text-base">{formatETB(auction.bid_cost)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('bid_cost')} / bid</p>
            </div>
            <div className={`rounded-2xl p-3.5 text-center ${isUrgent ? 'bg-red-50 dark:bg-red-500/10' : 'bg-gray-50 dark:bg-white/5'}`}>
              <div className="flex justify-center mb-1">
                <Clock size={16} className={isUrgent ? 'text-red-500' : 'text-muted-foreground'} />
              </div>
              <p className={`font-black text-sm tabular-nums ${isUrgent ? 'text-red-600 dark:text-red-400' : ''}`}>
                {formatCountdown(auction.end_time)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('time_remaining')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3.5 text-center">
              <div className="flex justify-center mb-1">
                <Users size={16} className="text-muted-foreground" />
              </div>
              <p className="font-black text-base">{auction.participant_count ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('participants')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bid panel ── */}
      {isActive && (
        <div className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900/60
                        overflow-hidden shadow-xl">
          {/* Header */}
          <div className={`px-5 py-3.5 flex items-center justify-between border-b border-gray-100 dark:border-white/10
            ${isUrgent ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10' : ''}`}>
            <h2 className="font-black">{t('place_bid')}</h2>
            {balance !== null && (
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${
                notEnoughBalance ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                <Wallet size={14} />
                {formatETB(balance)}
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            {notEnoughBalance && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200
                              dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-2xl p-3.5 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Balance too low</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    Each bid costs {formatETB(auction.bid_cost)}.{' '}
                    <Link to="/wallet" className="underline font-bold">Add balance →</Link>
                  </p>
                </div>
              </div>
            )}

            {/* Bid amount input */}
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min={auction.min_bid}
                max={auction.max_bid ?? undefined}
                className="input-field pr-20 text-lg font-bold"
                placeholder={`e.g. ${auction.min_bid || '1.00'}`}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                disabled={notEnoughBalance}
                onKeyDown={e => e.key === 'Enter' && !notEnoughBalance && placeBid()}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                ETB
              </span>
            </div>

            {auction.max_bid && (
              <p className="text-xs text-muted-foreground px-1">
                Range: {auction.min_bid} – {auction.max_bid} ETB
              </p>
            )}

            {/* Bid button */}
            <button
              className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]
                ${justBid
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30'
                  : isUrgent
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-xl shadow-red-500/25'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-xl shadow-brand-700/25'
                }`}
              onClick={placeBid}
              disabled={loading || notEnoughBalance}
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing bid…</>
              ) : justBid ? (
                <><CheckCircle2 size={20} /> Bid placed!</>
              ) : (
                <><Zap size={18} /> {t('place_bid')} · {formatETB(auction.bid_cost)}</>
              )}
            </button>

            {msg && (
              <div className={`flex items-center gap-2.5 text-sm font-medium rounded-2xl px-4 py-3
                ${msgType === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20'
                }`}>
                {msgType === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {msg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inactive state */}
      {!isActive && (
        <div className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900/60 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-muted-foreground" />
          </div>
          <p className="font-bold text-lg capitalize">{auction.status}</p>
          <p className="text-sm text-muted-foreground mt-1">This auction has ended.</p>
          <Link to="/auctions" className="mt-4 inline-flex btn-secondary text-sm">
            Browse other auctions
          </Link>
        </div>
      )}
    </div>
  )
}
