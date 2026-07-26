import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'
import {
  Gavel, Clock, Coins, PlayCircle, CheckCircle2, PauseCircle, XCircle,
  Sparkles, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react'

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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function CalendarPicker({
  selected, onSelect, onClose
}: { selected: Date; onSelect: (d: Date) => void; onClose: () => void }) {
  const [month, setMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1))
  const today = new Date(); today.setHours(0,0,0,0)

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstDow = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const pick = (day: number) => {
    const d = new Date(selected)
    d.setFullYear(month.getFullYear(), month.getMonth(), day)
    onSelect(d)
    onClose()
  }

  return (
    <div className="absolute z-50 mt-2 bg-gray-900 border border-white/15 rounded-2xl shadow-2xl p-4 w-72">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-white">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </span>
        <button
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const cellDate = new Date(month.getFullYear(), month.getMonth(), day)
          cellDate.setHours(0,0,0,0)
          const isPast = cellDate < today
          const isSelected = selected.getDate() === day
            && selected.getMonth() === month.getMonth()
            && selected.getFullYear() === month.getFullYear()
          const isToday = cellDate.getTime() === today.getTime()

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => !isPast && pick(day)}
              className={`
                w-full aspect-square rounded-xl text-sm font-semibold transition-all
                ${isPast ? 'text-gray-700 cursor-not-allowed' : 'cursor-pointer hover:bg-brand-500/20 hover:text-brand-300'}
                ${isSelected ? 'bg-brand-600 text-white shadow-lg shadow-brand-700/30 hover:bg-brand-600 hover:text-white' : ''}
                ${isToday && !isSelected ? 'border border-brand-500/40 text-brand-400' : ''}
                ${!isSelected && !isPast && !isToday ? 'text-gray-200' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Quick picks */}
      <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-3 gap-1.5">
        {[
          { label: '+1 day',  days: 1 },
          { label: '+3 days', days: 3 },
          { label: '+7 days', days: 7 },
        ].map(({ label, days }) => {
          const d = new Date(); d.setDate(d.getDate() + days); d.setHours(23, 59, 0, 0)
          return (
            <button key={days}
              className="text-xs text-gray-400 hover:text-brand-300 bg-white/5 hover:bg-brand-500/15 rounded-lg py-1.5 transition-all font-medium"
              onClick={() => { onSelect(d); onClose() }}>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function durationLabel(end: Date) {
  const ms = end.getTime() - Date.now()
  if (ms <= 0) return 'in the past'
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  const rh = h % 24
  if (d === 0) return `${h}h from now`
  if (rh === 0) return `${d} day${d > 1 ? 's' : ''} from now`
  return `${d}d ${rh}h from now`
}

export default function AdminAuctions() {
  const [auctions, setAuctions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState('')

  // End date + time picker
  const defaultEnd = (() => {
    const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(23, 59, 0, 0); return d
  })()
  const [endDate, setEndDate] = useState<Date>(defaultEnd)
  const [endTimeStr, setEndTimeStr] = useState('23:59')
  const [calOpen, setCalOpen] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

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

  // Sync time string → endDate
  const handleTimeChange = (t: string) => {
    setEndTimeStr(t)
    const [h, m] = t.split(':').map(Number)
    setEndDate(prev => {
      const d = new Date(prev); d.setHours(h, m, 0, 0); return d
    })
  }

  const handleDateSelect = (d: Date) => {
    const [h, m] = endTimeStr.split(':').map(Number)
    d.setHours(h, m, 0, 0)
    setEndDate(d)
  }

  const create = async () => {
    if (!productId) { setMsg('Pick a product first'); setMsgOk(false); return }
    if (endDate <= new Date()) { setMsg('End date must be in the future'); setMsgOk(false); return }
    setCreating(true)
    const { error } = await supabase.from('auctions').insert({
      product_id: productId,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: endDate.toISOString(),
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

  const formatEndDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-md space-y-4">
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

        {/* Date picker */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
            <CalendarDays size={12} />
            Auction ends on
          </label>
          <div className="relative" ref={calRef}>
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setCalOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/10
                         px-3.5 py-3 text-sm text-gray-100 hover:bg-white/8 hover:border-white/20 transition text-left"
            >
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="text-brand-400 flex-shrink-0" />
                <span className="font-medium">{formatEndDate(endDate)}</span>
                <span className="text-gray-500">at {endTimeStr}</span>
              </span>
              <span className="text-xs text-brand-400 font-semibold bg-brand-400/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                {durationLabel(endDate)}
              </span>
            </button>

            {calOpen && (
              <CalendarPicker
                selected={endDate}
                onSelect={handleDateSelect}
                onClose={() => setCalOpen(false)}
              />
            )}
          </div>

          {/* Time picker */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">End time:</span>
            <input
              type="time"
              value={endTimeStr}
              onChange={e => handleTimeChange(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Bid cost (ETB)</label>
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
            type="number" step="0.01" value={bidCost} onChange={e => setBidCost(e.target.value)}
          />
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
