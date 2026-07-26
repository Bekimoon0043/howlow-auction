import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminAuctions() {
  const [auctions, setAuctions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productId, setProductId] = useState('')
  const [hours, setHours] = useState('72')
  const [bidCost, setBidCost] = useState('1.00')
  const [msg, setMsg] = useState('')

  const load = async () => {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('auctions').select('*, products(title_en)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, title_en').eq('is_active', true)
    ])
    setAuctions(a || [])
    setProducts(p || [])
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!productId) return
    const end = new Date(Date.now() + parseInt(hours) * 3600000).toISOString()
    const { error } = await supabase.from('auctions').insert({
      product_id: productId,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: end,
      bid_cost: parseFloat(bidCost)
    })
    if (error) setMsg(error.message)
    else {
      setMsg('Auction created & published')
      load()
    }
  }

  const resolve = async (id: string) => {
    const { data, error } = await supabase.rpc('resolve_auction', { p_auction_id: id })
    if (error) setMsg(error.message)
    else {
      setMsg(JSON.stringify(data))
      load()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Auctions</h1>
      <div className="card p-4 space-y-3 max-w-md">
        <select className="input-field" value={productId} onChange={e => setProductId(e.target.value)}>
          <option value="">Select product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.title_en}</option>)}
        </select>
        <input className="input-field" type="number" placeholder="Duration (hours)" value={hours} onChange={e => setHours(e.target.value)} />
        <input className="input-field" type="number" step="0.01" placeholder="Bid cost (ETB, deducted per bid)" value={bidCost} onChange={e => setBidCost(e.target.value)} />
        <button className="btn-primary" onClick={create}>Create & Publish</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
      <div className="space-y-2">
        {auctions.map(a => (
          <div key={a.id} className="card p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{a.products?.title_en}</p>
              <p className="text-xs">{a.status} · ends {a.end_time ? new Date(a.end_time).toLocaleString() : '—'}</p>
            </div>
            {a.status === 'active' && (
              <button className="btn-secondary text-sm" onClick={() => resolve(a.id)}>Resolve Now</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
