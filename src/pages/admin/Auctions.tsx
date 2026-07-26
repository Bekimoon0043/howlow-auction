import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'
import { Gavel, Clock, Coins, PlayCircle, CheckCircle2, PauseCircle, XCircle, Sparkles } from 'lucide-react'

type Status = 'active' | 'paused' | 'ended' | 'no_winner' | string

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  active:    { bg: 'bg-brand-400/15',  text: 'text-brand-400',  icon: PlayCircle,  label: 'Active' },
  paused:    { bg: 'bg-amber-400/15',  text: 'text-amber-400',  icon: PauseCircle, label: 'Paused' },
  ended:     { bg: 'bg-emerald-400/15',text: 'text-emerald-400',icon: CheckCircle2,label: 'Ended' },
  no_winner: { bg: 'bg-gray-400/15',   text: 'text-gray-400',   icon: XCircle,     label: 'No Winner' }
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.no_winner
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <Icon size={12} />
      {s.label}
    </span>
  )
}

function timeLeft(end: string | null) {
  if (!end) return '—'
  const diff = new Date(end).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h left`
  return `${h}h ${m}m left`
}

export default function AdminAuctions() {
  const [auctions, setAuctions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState('')
  const [hours, setHours] = useState('72')
  const [bidCost, setBidCost] = useState('1.00')
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [creating, setCreating] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const load = async () => {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('auctions').select('*, products(title_en, product_images(storage_path))').order('created_at', { ascending: false }),
      supabase.from('products').select('id, title_en').eq('is_active', true)
    ])
    setAuctions(a || [])
    setProducts(p || [])
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!productId) { setMsg('Pick a product first'); setMsgOk(false); return }
    setCreating(true)
    const end = new Date(Date.now() + parseInt(hours) * 3600000).toISOString()
    const { error } = await supabase.from('auctions').insert({
      product_id: productId,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: end,
      bid_cost: parseFloat(bidCost)
    })
    setCreating(false)
    if (error) { setMsg(error.message); setMsgOk(false) }
    else {
      setMsg('Auction created & published ✓')
      setMsgOk(true)
      setProductId('')
      load()
    }
  }

  const resolve = async (id: string) => {
    setResolvingId(id)
    const { data, error } = await supabase.rpc('resolve_auction', { p_auction_id: id })
    setResolvingId(null)
    if (error) { setMsg(error.message); setMsgOk(false) }
    else {
      setMsg(data?.status === 'no_winner' ? 'Resolved — no unique bid, no winner.' : 'Auction resolved — winner selected ✓')
      setMsgOk(true)
      load()
    }
  }

  const activeCount = auctions.filter(a => a.status === 'active').length

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Gavel className="text-brand-400" size={22} />
            Auctions
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {activeCount} live right now · {auctions.length} total
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-md space-y-3">
        <p className="text-sm font-bold text-white flex items-center gap-1.5">
          <Sparkles size={14} className="text-brand-400" /> Publish a new auction
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Product</label>
          <select
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
            value={productId} onChange={e => setProductId(e.target.value)}
          >
            <option value="" className="bg-gray-900">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id} className="bg-gray-900">{p.title_en}</option>)}
          </select>
          {products.length === 0 && (
            <p className="text-xs text-amber-400 mt-1.5">No products yet — add one on the Products page first.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration (hours)</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
              type="number" value={hours} onChange={e => setHours(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Bid cost (ETB)</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
              type="number" step="0.01" value={bidCost} onChange={e => setBidCost(e.target.value)}
            />
          </div>
        </div>

        <button
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500
                     hover:from-brand-500 hover:to-brand-400 active:scale-[0.98] text-white font-semibold text-sm
                     py-3 rounded-xl transition-all shadow-lg shadow-brand-700/25 disabled:opacity-50"
          onClick={create}
          disabled={creating}
        >
          {creating ? 'Publishing…' : 'Create & Publish'}
        </button>

        {msg && (
          <p className={`text-sm font-medium ${msgOk ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
        )}
      </div>

      {/* Auction list */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">All Auctions</p>
        <div className="space-y-2">
          {auctions.length === 0 && (
            <p className="text-sm text-gray-500 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              No auctions yet. Create your first one above.
            </p>
          )}
          {auctions.map(a => {
            const img = a.products?.product_images?.[0]?.storage_path
            return (
              <div key={a.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/8 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {img ? (
                    <img src={/^https?:\/\//i.test(img) ? img : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`}
                         alt="" className="w-full h-full object-cover" />
                  ) : <Gavel size={16} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm truncate">{a.products?.title_en || 'Untitled'}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Clock size={11} />{timeLeft(a.end_time)}</span>
                    <span className="inline-flex items-center gap-1"><Coins size={11} />{formatETB(a.bid_cost)}/bid</span>
                    <span>{a.participant_count ?? 0} bidders</span>
                  </div>
                </div>
                {a.status === 'active' && (
                  <button
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15
                               text-gray-200 transition-all disabled:opacity-50 whitespace-nowrap"
                    onClick={() => resolve(a.id)}
                    disabled={resolvingId === a.id}
                  >
                    {resolvingId === a.id ? 'Resolving…' : 'Resolve Now'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
